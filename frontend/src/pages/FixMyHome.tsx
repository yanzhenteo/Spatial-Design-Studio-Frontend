// src/pages/FixMyHome.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import Button from '../components/Button';
import DoubleButton from '../components/DoubleButton';
import { useCamera } from '../utils/cameraUtils';

interface FixMyHomeProps {
  onBack: () => void;
}

type FeatureStep = 'step1' | 'step2' | 'step3' | 'step4' | 'recommendations';

function FixMyHome({ onBack }: FixMyHomeProps) {
  const [currentStep, setCurrentStep] = useState<FeatureStep>('step1');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Define handleNext first using useCallback to avoid recreation
  const handleNext = useCallback(() => {
    const steps: FeatureStep[] = ['step1', 'step2', 'step3', 'step4', 'recommendations'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const handleStart = () => {
    setCurrentStep('step2');
  };

  const handleBack = () => {
    const steps: FeatureStep[] = ['step1', 'step2', 'step3', 'step4', 'recommendations'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(item => item !== issue)
        : [...prev, issue]
    );
  };

  // Use the camera hook AFTER handleNext is defined
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
  } = useCamera(handleNext);

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

  // Clean up camera when step changes away from step 3
  useEffect(() => {
    if (currentStep !== 'step3') {
      stopCamera();
      setCameraError(null);
    }
  }, [currentStep, stopCamera]);

  // Scroll to top when step changes to recommendations
  useEffect(() => {
    if (currentStep === 'recommendations') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Format selected issues for display
  const formatSelectedIssues = () => {
    if (selectedIssues.length === 0) return '';
    if (selectedIssues.length === 1) return selectedIssues[0];
    
    // Capitalize first letter of each word
    const capitalizedIssues = selectedIssues.map(issue => 
      issue.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );
    
    if (capitalizedIssues.length === 2) {
      return `${capitalizedIssues[0]} and ${capitalizedIssues[1]}`;
    }
    
    return capitalizedIssues.slice(0, -1).join(', ') + ' and ' + capitalizedIssues.slice(-1);
  };

  // Symptom descriptions for each issue
  const getSymptomDescriptions = () => {
    const descriptions: Record<string, string> = {
      'Way-finding': 'Difficulty navigating familiar spaces and getting lost in the home.',
      'Glare sensitivity': 'Eyes are easily bothered by bright lights and reflections.',
      'Misplacing items': 'Frequently losing track of everyday objects like keys and glasses.',
      'Forgetfulness': 'Trouble remembering recent events and daily routines.',
      'Lack spatial perception': 'Misjudging distances and having trouble with depth perception.'
    };

    return selectedIssues.map(issue => descriptions[issue] || '').filter(desc => desc !== '');
  };

  // Handle step 3 next button click
  const handleStep3Next = () => {
    // If there's a captured image, upload it first, then move to next step
    if (capturedImage) {
      handleUploadImage();
    } else {
      // If no image, just move to next step
      handleNext();
    }
  };

  // Handle end button click - go back to homepage
  const handleEnd = () => {
    onBack();
  };

  // Step configurations
  const stepConfigs = {
    step1: {
      header: "What would you like to fix?",
      content: "You may pick one or more options:",
      buttonText: "Confirm",
      onButtonClick: handleStart
    },
    step2: {
      header: formatSelectedIssues() || "Symptom Overview",
      content: "Any further comments or elaboration you would like to add?",
      symptomDescriptions: getSymptomDescriptions().join(' '),
      buttonText: "Next",
      onButtonClick: handleNext
    },
    step3: {
      header: formatSelectedIssues() || "Comfort Assessment",
      content: "Let's take a photo of the area you'd like to improve. This will help us provide better recommendations.",
      buttonText: "Next", 
      onButtonClick: handleStep3Next
    },
    step4: {
      header: "Results",
      content: "Based on your assessment, here are our recommendations:",
      buttonText: "Complete",
      onButtonClick: handleNext
    },
    recommendations: {
      header: "Let's make changes!",
      content: "Here are some recommended products to help implement the improvements:",
      buttonText: "End",
      onButtonClick: handleEnd
    }
  };

  const currentConfig = stepConfigs[currentStep];

  const issueButtons = [
    'Way-finding',
    'Glare sensitivity', 
    'Misplacing items',
    'Forgetfulness',
    'Lack spatial perception'
  ];

  return (
    <motion.div
      key="fixmyhome-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gradient-yellow-to-pink flex flex-col items-center p-6"
    >
      {/* Back Button - Responsive positioning */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={onBack}
          className="text-muted-purple text-button-text flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>

      {/* Animated Card Container - Centered content */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header Card */}
            <HeaderCard className="mb-6">
              <h1 className="text-header text-dark-grey mb-2">{currentConfig.header}</h1>
              {/* Symptom descriptions - only show on step2 */}
              {currentStep === 'step2' && (
                <p className="text-big-text text-dark-grey opacity-80">
                  {(currentConfig as any).symptomDescriptions}
                </p>
              )}
            </HeaderCard>

            {/* Content Card */}
            <ContentCard>
              {/* Content text - show for all steps */}
              {currentConfig.content && (
                <p className="text-big-text text-dark-grey text-center mb-6">
                  {currentConfig.content}
                </p>
              )}

              {/* Text input field - only show on step2 */}
              {currentStep === 'step2' && (
                <div className="w-full mb-6">
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Type your comments here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey bg-white resize-none"
                    rows={4}
                  />
                </div>
              )}

              {/* Camera interface - only show on step3 */}
              {currentStep === 'step3' && (
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
              )}

              {/* Results content - only show on step4 */}
              {currentStep === 'step4' && (
                <div className="w-full mb-6 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-dark-grey mb-3">Recommendations</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-1">Improved Lighting</h4>
                        <p className="text-sm text-gray-600">Consider adding motion-activated night lights in hallways and bathrooms to improve way-finding.</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-1">Organization System</h4>
                        <p className="text-sm text-gray-600">Implement a consistent storage system with labeled containers for frequently used items.</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-1">Safety Improvements</h4>
                        <p className="text-sm text-gray-600">Add grab bars in bathrooms and remove tripping hazards from walkways.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-dark-grey mb-3">Next Steps</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                      <li>Schedule a home safety assessment with our specialist</li>
                      <li>Review recommended products in our online catalog</li>
                      <li>Download your personalized home improvement checklist</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Product recommendations - only show on recommendations step */}
              {currentStep === 'recommendations' && (
                <div className="w-full mb-6 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-dark-grey mb-3">Recommended Products</h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-2">Motion-Activated Night Lights</h4>
                        <p className="text-sm text-gray-600 mb-2">Perfect for hallways and bathrooms to improve way-finding at night.</p>
                        <a href="#" className="text-red text-sm font-medium hover:underline">View on Amazon →</a>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-2">Labeled Storage Containers</h4>
                        <p className="text-sm text-gray-600 mb-2">Clear containers with large labels for easy organization.</p>
                        <a href="#" className="text-red text-sm font-medium hover:underline">View on IKEA →</a>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-2">Safety Grab Bars</h4>
                        <p className="text-sm text-gray-600 mb-2">Sturdy grab bars for bathrooms and stairways.</p>
                        <a href="#" className="text-red text-sm font-medium hover:underline">View on Home Depot →</a>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-dark-grey mb-2">Anti-Glare Light Bulbs</h4>
                        <p className="text-sm text-gray-600 mb-2">Soft white bulbs that reduce glare and eye strain.</p>
                        <a href="#" className="text-red text-sm font-medium hover:underline">View on Lowe's →</a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-dark-grey mb-3">Additional Resources</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                      <li>Home Safety Assessment Guide (PDF Download)</li>
                      <li>Weekly Organization Checklist</li>
                      <li>Emergency Contact Information Sheet</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Issue Selection Buttons - Only show on step1 */}
              {currentStep === 'step1' && (
                <div className="space-y-3 mb-6">
                  {issueButtons.map((issue) => (
                    <button
                      key={issue}
                      onClick={() => toggleIssue(issue)}
                      className={`w-full py-3 px-4 rounded-lg text-button-text transition-all duration-200 ${
                        selectedIssues.includes(issue)
                          ? 'bg-pink text-dark-grey shadow-md' 
                          : 'bg-white text-dark-grey border-1'
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              )}

              {/* Step Indicator - Show on all steps except recommendations */}
              {currentStep !== 'recommendations' && (
                <div className="flex justify-center space-x-2 mb-6">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step <= (['step1', 'step2', 'step3', 'step4', 'recommendations'].indexOf(currentStep) + 1)
                          ? 'bg-red'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Buttons */}
              {currentStep === 'step1' || currentStep === 'recommendations' ? (
                // Single button for step1 and recommendations steps
                <Button 
                  variant="danger" 
                  onClick={currentConfig.onButtonClick}
                  disabled={currentStep === 'step1' && selectedIssues.length === 0}
                >
                  {currentConfig.buttonText}
                </Button>
              ) : currentStep === 'step4' ? (
                // Single button for step4
                <Button 
                  variant="danger" 
                  onClick={currentConfig.onButtonClick}
                >
                  {currentConfig.buttonText}
                </Button>
              ) : (
                // Double buttons for intermediate steps (step2 and step3)
                <DoubleButton
                  variant="danger"
                  leftButton={{
                    onClick: handleBack,
                    children: "Back"
                  }}
                  rightButton={{
                    onClick: currentConfig.onButtonClick,
                    children: currentConfig.buttonText,
                    // Step 3 next button is never disabled now
                    disabled: false
                  }}
                />
              )}

              {/* Selection count hint for step1 */}
              {currentStep === 'step1' && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  {selectedIssues.length === 0 
                    ? 'Select one or more options to continue' 
                    : `${selectedIssues.length} option${selectedIssues.length !== 1 ? 's' : ''} selected`
                  }
                </p>
              )}
            </ContentCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default FixMyHome;