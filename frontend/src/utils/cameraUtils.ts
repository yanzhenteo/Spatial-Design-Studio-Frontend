import { useState, useRef, useEffect, type RefObject } from 'react';
import { analyzeAndTransformImage, type Issue } from '../services/imageAnalysisService';

export interface AnalysisResults {
  analysisText: string;
  issues: Issue[];
  transformedImageUrl: string | null;
}

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
  uploadImage: (selectedIssues: string[], comments: string) => Promise<AnalysisResults>;
}

export const useCamera = (onUploadComplete?: (results: AnalysisResults) => void): CameraHookReturn => {
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
   * Upload image to backend and process through analysis + transformation pipeline
   */
  const uploadImage = async (
    selectedIssues: string[],
    comments: string
  ): Promise<AnalysisResults> => {
    if (!capturedImage) throw new Error("No image to upload.");

    setIsUploading(true);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      console.log("Starting image analysis and transformation pipeline...");
      console.log("Selected issues:", selectedIssues);
      console.log("Comments:", comments);

      // Call the analysis and transformation service
      const result = await analyzeAndTransformImage(blob);

      if (!result.success) {
        throw new Error(result.error || "Analysis and transformation failed.");
      }

      console.log("Pipeline completed successfully!");
      console.log("Issues found:", result.issues.length);
      console.log("Transformed image:", result.transformedImageUrl ? "Available" : "Not available");

      const analysisResults: AnalysisResults = {
        analysisText: result.analysisText,
        issues: result.issues,
        transformedImageUrl: result.transformedImageUrl
      };

      // Call the completion callback with results
      if (onUploadComplete) {
        onUploadComplete(analysisResults);
      }

      return analysisResults;

    } catch (error) {
      console.error("Error in image processing pipeline:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to process image."
      );
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