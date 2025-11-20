import React, { useState } from 'react';
import { useCamera } from '../utils/cameraUtils.ts';

interface CameraStepProps {
  selectedIssues: string[];
  comments: string;
  onNext: () => void;
}

const CameraStep: React.FC<CameraStepProps> = ({
  selectedIssues,
  comments,
  onNext
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Use the camera hook directly in the component
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
  } = useCamera(onNext);

  // Enhanced camera functions with error handling
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      await startCamera();
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to start camera');
    }
  };

  const handleCaptureImage = () => {
    setCameraError(null);
    try {
      captureImage();
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to capture image');
    }
  };

  const handleUploadImage = async () => {
    setCameraError(null);
    try {
      await uploadImage(selectedIssues, comments);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  return (
    <div className="w-full mb-6 space-y-4">
      {/* Error message */}
      {cameraError && (
        <div className="bg-red bg-opacity-10 border border-red rounded-lg p-3">
          <p className="text-red text-sm text-center">{cameraError}</p>
        </div>
      )}

      {/* Camera view */}
      {isCameraActive && !capturedImage && (
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

      {/* Captured image preview */}
      {capturedImage && (
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

      {/* Start camera button */}
      {!isCameraActive && !capturedImage && (
        <button
          onClick={handleStartCamera}
          className="w-full bg-red text-white py-3 rounded-lg text-button-text font-medium hover:opacity-90"
        >
          Open Camera
        </button>
      )}
    </div>
  );
};

export default CameraStep;