import React, { useState, useRef } from 'react';
import { useCamera, type AnalysisResults } from '../utils/cameraUtils.ts';
import { analyzeAndTransformImage } from '../services/imageAnalysisService';
import DoubleButton from './DoubleButton';

interface CameraStepProps {
  selectedIssues: string[];
  comments: string;
  onAnalysisComplete: (results: AnalysisResults) => void;
}

const CameraStep: React.FC<CameraStepProps> = ({
  selectedIssues,
  comments,
  onAnalysisComplete
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null); // New state for gallery image preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the existing camera hook with the new callback
  const {
    isCameraActive,
    capturedImage,
    isUploading,
    isVideoReady,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    retakePhoto,
    uploadImage,
  } = useCamera(onAnalysisComplete);

  // Enhanced camera functions with error handling - using the existing hook functions
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      await startCamera(); // This uses the existing working function
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to start camera');
    }
  };

  const handleCaptureImage = () => {
    setCameraError(null);
    try {
      captureImage(); // This uses the existing working function
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to capture image');
    }
  };

  const handleUploadImage = async () => {
    setCameraError(null);
    try {
      await uploadImage(selectedIssues, comments); // This uses the existing working function
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  // Handle gallery image selection - NEW FUNCTIONALITY
  const handleUploadImageButton = () => {
    setCameraError(null);
    fileInputRef.current?.click();
  };

  // Handle file selection from gallery - NEW FUNCTIONALITY
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCameraError('Image size should be less than 10MB');
      return;
    }

    // Create a URL for the selected image and show preview
    const imageUrl = URL.createObjectURL(file);
    setGalleryImage(imageUrl);

    // Reset the file input
    event.target.value = '';
  };

  // Custom upload flow for gallery images - now with API integration
  const handleGalleryImageUpload = async () => {
    if (!galleryImage) return;

    setIsGalleryUploading(true);
    setCameraError(null);

    try {
      // Convert the object URL back to a blob
      const response = await fetch(galleryImage);
      const blob = await response.blob();

      console.log("Starting image analysis and transformation pipeline for gallery image...");
      console.log("Selected issues:", selectedIssues);
      console.log("Comments:", comments);

      // Call the analysis and transformation service (same as camera upload)
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

      // Call the completion callback with results (same as camera upload)
      onAnalysisComplete(analysisResults);

    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to process image');
      console.error('Gallery upload error:', error);
    } finally {
      setIsGalleryUploading(false);
    }
  };

  // Retake gallery image
  const handleRetakeGalleryImage = () => {
    if (galleryImage) {
      URL.revokeObjectURL(galleryImage); // Clean up the object URL
    }
    setGalleryImage(null);
    setCameraError(null);
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      if (galleryImage) {
        URL.revokeObjectURL(galleryImage);
      }
    };
  }, [galleryImage]);

  return (
    <div className="w-full mb-6 space-y-4">
      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Error message */}
      {cameraError && (
        <div className="bg-red bg-opacity-10 border border-red rounded-lg p-3">
          <p className="text-red text-sm text-center">{cameraError}</p>
        </div>
      )}

      {/* Camera view - USING EXISTING HOOK FUNCTIONALITY */}
      {isCameraActive && !capturedImage && !galleryImage && (
        <div className="space-y-4">
          <div className="relative bg-gray-200 rounded-lg border-2 border-gray-300 min-h-[300px] flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full rounded-lg"
              style={{ maxHeight: '400px', objectFit: 'cover' }}
            />
            {/* Only show loading message when video is NOT ready */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Camera starting...</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-300 text-dark-grey py-3 rounded-lg text-button-text font-medium hover:opacity-90"
            >
              Close Camera
            </button>
            <button
              onClick={handleCaptureImage}
              disabled={!isVideoReady}
              className="flex-1 bg-red text-white py-3 rounded-lg text-button-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVideoReady ? 'Take Photo' : 'Preparing...'}
            </button>
          </div>
        </div>
      )}

      {/* Captured image preview - USING EXISTING HOOK FUNCTIONALITY */}
      {capturedImage && !galleryImage && (
        <div className="space-y-4">
          <div className="bg-gray-200 rounded-lg border-2 border-gray-300 min-h-[300px] flex items-center justify-center">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg max-h-[400px] object-cover"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={retakePhoto}
              className="flex-1 bg-gray-300 text-dark-grey py-3 rounded-lg text-button-text font-medium hover:opacity-90"
            >
              Retake
            </button>
            <button
              onClick={handleUploadImage}
              disabled={isUploading}
              className="flex-1 bg-red text-white py-3 rounded-lg text-button-text font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Use This Photo'}
            </button>
          </div>
        </div>
      )}

      {/* Gallery image preview - NEW FUNCTIONALITY */}
      {galleryImage && !capturedImage && !isCameraActive && (
        <div className="space-y-4">
          <div className="bg-gray-200 rounded-lg border-2 border-gray-300 min-h-[300px] flex items-center justify-center">
            <img
              src={galleryImage}
              alt="Selected from gallery"
              className="w-full rounded-lg max-h-[400px] object-cover"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRetakeGalleryImage}
              className="flex-1 bg-gray-300 text-dark-grey py-3 rounded-lg text-button-text font-medium hover:opacity-90"
            >
              Choose Different Image
            </button>
            <button
              onClick={handleGalleryImageUpload}
              disabled={isGalleryUploading}
              className="flex-1 bg-red text-white py-3 rounded-lg text-button-text font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isGalleryUploading ? 'Uploading...' : 'Use This Photo'}
            </button>
          </div>
        </div>
      )}

      {/* Double Button - only show when no image is active */}
      {!isCameraActive && !capturedImage && !galleryImage && (
        <DoubleButton
          leftButton={{
            onClick: handleUploadImageButton,
            children: "Upload Image"
          }}
          rightButton={{
            onClick: handleStartCamera,
            children: "Open Camera"
          }}
          variant="danger"
        />
      )}
    </div>
  );
};

export default CameraStep;