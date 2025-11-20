// src/utils/cameraUtils.ts
import { useState, useRef, useEffect, type RefObject } from 'react';

export interface CameraHookReturn {
  isCameraActive: boolean;
  capturedImage: string | null;
  isUploading: boolean;
  isVideoReady: boolean;
  videoRef: RefObject<HTMLVideoElement>;
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

  const startCamera = async (): Promise<void> => {
    try {
      console.log('Starting camera...');
      setIsVideoReady(false);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use 'user' for front camera if this doesn't work
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      console.log('Camera started successfully');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Remove any existing event listeners
        videoRef.current.onloadeddata = null;
        videoRef.current.oncanplay = null;
        videoRef.current.onplaying = null;

        // Use multiple events to detect when video is ready
        const onLoadedData = () => {
          console.log('Video loaded data');
        };

        const onCanPlay = () => {
          console.log('Video can play');
          setIsVideoReady(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        const onPlaying = () => {
          console.log('Video is playing');
          setIsVideoReady(true);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        videoRef.current.onloadeddata = onLoadedData;
        videoRef.current.oncanplay = onCanPlay;
        videoRef.current.onplaying = onPlaying;

        // Start playing the video
        await videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          // Even if play fails, try to set as ready if we have a stream
          if (stream.active) {
            setIsVideoReady(true);
          }
        });

        // Fallback: if video doesn't become ready within 3 seconds, force it
        timeoutRef.current = window.setTimeout(() => {
          if (!isVideoReady && stream.active) {
            console.log('Forcing video ready state after timeout');
            setIsVideoReady(true);
          }
        }, 3000);
      }
      
      streamRef.current = stream;
      setIsCameraActive(true);
      setCapturedImage(null);
      console.log('Camera state updated, isCameraActive:', true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Clean up on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      throw new Error('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = (): void => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadeddata = null;
      videoRef.current.oncanplay = null;
      videoRef.current.onplaying = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
    console.log('Camera stopped, isCameraActive:', false);
  };

  const captureImage = (): void => {
    console.log('Capturing image...');
    console.log('Video ready state:', isVideoReady);
    console.log('Video ref current:', videoRef.current);
    
    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Image captured, data URL length:', imageDataUrl.length);
        setCapturedImage(imageDataUrl);
        stopCamera();
      } else {
        console.error('Could not get canvas context');
        throw new Error('Failed to capture image. Please try again.');
      }
    } else {
      console.error('Video not ready for capture. Details:', {
        hasVideoRef: !!videoRef.current,
        videoWidth: videoRef.current?.videoWidth,
        videoHeight: videoRef.current?.videoHeight,
        isVideoReady,
        srcObject: videoRef.current?.srcObject
      });
      throw new Error('Camera not ready for capture. Please wait a moment and try again.');
    }
  };

  const retakePhoto = (): void => {
    console.log('Retaking photo...');
    setCapturedImage(null);
    startCamera();
  };

  const uploadImage = async (selectedIssues: string[], comments: string): Promise<void> => {
    if (!capturedImage) {
      throw new Error('No image to upload');
    }

    setIsUploading(true);
    try {
      // Convert base64 to blob for sending to backend
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create FormData to send the image
      const formData = new FormData();
      formData.append('image', blob, 'captured-image.jpg');
      formData.append('selectedIssues', JSON.stringify(selectedIssues));
      formData.append('comments', comments);

      // Send to your backend API
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const result = await uploadResponse.json();
      console.log('Upload successful:', result);
      
      // Call the completion callback if provided
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Clean up camera when component unmounts
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
    videoRef: videoRef as RefObject<HTMLVideoElement>,
    startCamera,
    stopCamera,
    captureImage,
    retakePhoto,
    uploadImage,
  };
};