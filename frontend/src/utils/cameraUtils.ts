// src/utils/cameraUtils.ts
import { useState, useRef, useEffect, type RefObject } from 'react';

export interface CameraHookReturn {
  isCameraActive: boolean;
  capturedImage: string | null;
  isUploading: boolean;
  isVideoReady: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => void;
  retakePhoto: () => void;
  uploadImage: (selectedIssues: string[], comments: string) => Promise<void>;
}

export const useCamera = (onUploadComplete?: () => void): CameraHookReturn => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  /**
   * Start the camera
   */
  const startCamera = async (): Promise<void> => {
    try {
      console.log("Starting camera...");
      setIsVideoReady(false);

      // 1. Get the stream FIRST (Before checking for videoRef)
      // This prompts the user for permission immediately.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log("Camera stream acquired.");
      streamRef.current = stream;

      // 2. Update state to Render the <video> element
      setIsCameraActive(true);
      setCapturedImage(null);

      // 3. Wait for React to mount the <video> element
      // We need to give React a moment to render after setting state
      let videoElement: HTMLVideoElement | null = null;
      
      for (let i = 0; i < 15; i++) { // Increased attempts slightly
        if (videoRef.current) {
          videoElement = videoRef.current;
          break;
        }
        console.log("Waiting for video element to mount…");
        await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
      }

      if (!videoElement) {
        // If it fails, stop the stream we just acquired to prevent memory leaks
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element is not mounted.");
      }

      // 4. Attach stream to video element
      videoElement.srcObject = stream;

      // Clean existing listeners
      videoElement.onloadeddata = null;
      videoElement.oncanplay = null;
      videoElement.onplaying = null;

      // Reliable ready event
      videoElement.onloadedmetadata = () => {
        console.log("Video metadata loaded — playing.");
        videoElement?.play();
        setIsVideoReady(true);
      };

      // Fallback
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (!isVideoReady && stream.active) {
          console.log("Force-ready fallback triggered.");
          setIsVideoReady(true);
        }
      }, 3000);

      console.log("Camera active.");

    } catch (error) {
      console.error("Camera start error:", error);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsCameraActive(false); // Reset state on error
      throw new Error("Unable to access camera. Please grant permission.");
    }
  };

  /**
   * Stop camera
   */
  const stopCamera = (): void => {
    console.log("Stopping camera…");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadeddata = null;
      videoRef.current.oncanplay = null;
      videoRef.current.onplaying = null;
      videoRef.current.onloadedmetadata = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsCameraActive(false);
    setIsVideoReady(false);
  };

  /**
   * Capture image (draw video frame to canvas)
   */
  const captureImage = (): void => {
    console.log("Capturing image…");

    if (
      !videoRef.current ||
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      console.error("Cannot capture: video not ready.");
      throw new Error("Camera not ready for capture. Try again.");
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to draw video frame.");
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    console.log("Image captured. Size:", imageDataUrl.length);

    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  /**
   * Retake photo → reopen camera
   */
  const retakePhoto = (): void => {
    console.log("Retaking photo…");
    setCapturedImage(null);
    startCamera();
  };

  /**
   * Upload image to backend
   */
  const uploadImage = async (
    selectedIssues: string[],
    comments: string
  ): Promise<void> => {
    if (!capturedImage) throw new Error("No image to upload.");

    setIsUploading(true);

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, "captured-image.jpg");
      formData.append("selectedIssues", JSON.stringify(selectedIssues));
      formData.append("comments", comments);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed.");
      }

      console.log("Image uploaded successfully.");
      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      console.error("Error uploading:", error);
      throw new Error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    isCameraActive,
    capturedImage,
    isUploading,
    isVideoReady,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    retakePhoto,
    uploadImage
  };
};
