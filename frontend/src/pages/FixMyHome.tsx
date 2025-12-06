import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import StepIndicator, { type FeatureStep } from '../components/StepIndicator';
import BackButton from '../components/BackButton';
import CameraStep from '../components/CameraStep';
import ResultsStep from '../components/ResultsStep';
import IssueSelectionStep, { ALL_ISSUES } from '../components/IssueSelectionStep';
import CommentsStep from '../components/CommentsStep';
import StepNavigation from '../components/StepNavigation';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import { fetchIssuesFromLastConversation } from '../services/conversationIssueService';
import { saveFixMyHomeResult, fetchFixMyHomeHistoryEntry } from '../services/fixMyHomeHistoryService';
import type { AnalysisResults } from '../utils/cameraUtils';

interface FixMyHomeProps {
  onBack: () => void;
  historyId?: string; // Optional: if provided, load and display this history entry
}

// Add this interface for step configurations
interface StepConfig {
  header: string;
  content: string;
  secondQuestion?: string;
  symptomDescriptions?: string;
}

function FixMyHome({ onBack, historyId }: FixMyHomeProps) {
  const [currentStep, setCurrentStep] = useState<FeatureStep>(historyId ? 'step4' : 'step1');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [visibleIssues, setVisibleIssues] = useState<string[]>(ALL_ISSUES);
  const [comments, setComments] = useState('');
  const [noChangeComments, setNoChangeComments] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [hasImageSelected, setHasImageSelected] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Use ref instead of state to avoid triggering re-renders
  const imageUploadFnRef = useRef<(() => Promise<void>) | null>(null);

  // Helper function to convert blob URL to base64
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob URL to base64:', error);
      throw error;
    }
  };

  // Handle analysis completion from camera/gallery upload
  const handleAnalysisComplete = useCallback(async (results: AnalysisResults) => {
    console.log('Analysis complete, moving to step 4');
    console.log('Results:', results);
    console.log('Setting isProcessingImage to false');
    console.log('Setting currentStep to step4');
    setAnalysisResults(results);
    setIsProcessingImage(false);
    setCurrentStep('step4');

    // Save results to MongoDB history
    console.log('Saving results to history...');
    try {
      // Convert blob URL to base64 if it's a blob URL
      let transformedImageBase64: string | null = results.transformedImageUrl;
      if (transformedImageBase64 && transformedImageBase64.startsWith('blob:')) {
        console.log('Converting blob URL to base64...');
        transformedImageBase64 = await blobUrlToBase64(transformedImageBase64);
        console.log('Blob URL converted to base64');
      }

      const saveResult = await saveFixMyHomeResult({
        selectedIssues,
        comments,
        noChangeComments,
        originalImage: originalImage || '',
        transformedImage: transformedImageBase64,
        analysisText: results.analysisText,
        analysisJson: { issues: results.issues },
        success: true,
      });

      if (saveResult.success) {
        console.log('Results saved to history successfully:', saveResult.historyId);
      } else {
        console.error('Failed to save results to history:', saveResult.error);
      }
    } catch (error) {
      console.error('Error saving results to history:', error);
    }
  }, [selectedIssues, comments, noChangeComments, originalImage]);

  // Add a new function to handle when an image is captured/selected
  const handleImageCaptured = useCallback((imageDataUrl: string | null) => {
    setOriginalImage(imageDataUrl);
    setHasImageSelected(imageDataUrl !== null);
  }, []);

  // Handle image ready callback from CameraStep
  const handleImageReady = useCallback((uploadFn: (() => Promise<void>) | null) => {
    imageUploadFnRef.current = uploadFn;
    // Update state to track if we have an image (for button disable logic)
    setHasImageSelected(uploadFn !== null);
  }, []);

  // Define handleNext first using useCallback to avoid recreation
  const handleNext = useCallback(async () => {
    const steps: FeatureStep[] = ['step1', 'step2', 'step3', 'step4'];
    const currentIndex = steps.indexOf(currentStep);

    // If we're on step3 and have an image ready, trigger upload
    if (currentStep === 'step3' && imageUploadFnRef.current) {
      console.log('Starting image upload...');
      setIsProcessingImage(true);
      try {
        await imageUploadFnRef.current();
        console.log('Upload completed successfully');
        // Don't move to next step here - handleAnalysisComplete will do it
      } catch (error) {
        console.error('Failed to upload image:', error);
        setIsProcessingImage(false);
      }
    } else if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else if (currentStep === 'step4') {
      // When on step4 and clicking next, go back to homepage
      onBack();
    }
  }, [currentStep, onBack]);

  const handleStart = () => {
    setCurrentStep('step2');
  };

  const handleBack = () => {
    const steps: FeatureStep[] = ['step1', 'step2', 'step3', 'step4'];
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

  // UPDATED: Symptom descriptions aligned with ALL_ISSUES
  const getSymptomDescriptions = () => {
    const descriptions: Record<string, string> = {
      'Depth misjudgment': 'Difficulty judging steps, edges, or depth, which can increase fall risk.',
      'Pattern confusion': 'Patterned floors or shiny surfaces cause confusion or hesitation.',
      'Glare sensitivity': 'Eyes are easily bothered by bright lights, glare, or strong reflections.',
      'Mirror confusion': 'Mirrors sometimes cause confusion, distress, or misrecognition.',
      'Door confusion': 'Tends to go to the wrong door or has difficulty finding the right one.',
      'Night misorientation': 'At night, they may head toward the wrong room or exit instead of the bathroom.',
      'Bathroom slips': 'History of slipping or nearly falling in the bathroom recently.',
      'Stair difficulty': 'Has difficulty using stairs safely or confidently.',
      'Needs visibility': 'Loses track of items unless they are clearly visible and well organised.',
      'Clutter sensitivity': 'Feels overwhelmed or unsafe when there is clutter or too many objects on a surface.',
    };

    return selectedIssues
      .map(issue => descriptions[issue] || '')
      .filter(desc => desc !== '');
  };

  // LOAD HISTORY ENTRY IF historyId IS PROVIDED
  useEffect(() => {
    if (!historyId) return;

    (async () => {
      try {
        console.log('[FixMyHome] Loading history entry:', historyId);

        const result = await fetchFixMyHomeHistoryEntry(historyId);

        if ('success' in result && result.success && result.entry) {
          const entry = result.entry;
          console.log('[FixMyHome] History entry loaded:', entry);

          // Set all the saved data
          setSelectedIssues(entry.selectedIssues);
          setComments(entry.comments);
          setNoChangeComments(entry.noChangeComments);
          setOriginalImage(entry.originalImage);

          // Convert saved data to AnalysisResults format
          const analysisResults: AnalysisResults = {
            analysisText: entry.analysisText,
            issues: entry.analysisJson?.issues || [],
            transformedImageUrl: entry.transformedImage,
          };

          setAnalysisResults(analysisResults);
          setCurrentStep('step4');
        } else {
          console.error('[FixMyHome] Failed to load history:', result.error);
          // If loading fails, go back
          onBack();
        }
      } catch (error) {
        console.error('[FixMyHome] Error loading history:', error);
        onBack();
      }
    })();
  }, [historyId, onBack]);

  // PRELOAD ISSUES FROM LAST MEMORY BOT CONVERSATION (only if NOT viewing history)
  useEffect(() => {
    if (historyId) return; // Skip if viewing history

    (async () => {
      const issuesFromConversation = await fetchIssuesFromLastConversation();
      console.log('[FixMyHome] issuesFromConversation:', issuesFromConversation);

      if (issuesFromConversation.length > 0) {
        // Only show buttons for issues that were true in Memory Bot
        const filtered = ALL_ISSUES.filter(issue =>
          issuesFromConversation.includes(issue)
        );
        console.log('[FixMyHome] visibleIssues (filtered):', filtered);
        setVisibleIssues(filtered);

        // IMPORTANT CHANGE: do NOT preselect them,
        // let the user choose manually on this page.
        // setSelectedIssues(issuesFromConversation);
      } else {
        console.log('[FixMyHome] No issues from conversation, showing ALL_ISSUES.');
        setVisibleIssues(ALL_ISSUES);
        // selectedIssues stays [] so nothing is preselected.
      }
    })();
  }, [historyId]);

  // Step configurations
  const stepConfigs: Record<FeatureStep, StepConfig> = {
    step1: {
      header: "What would you like to fix?",
      content: "You may pick one or more options:",
    },
    step2: {
      header: formatSelectedIssues() || "Symptom Overview",
      content: "Is there anything you want to change?",
      secondQuestion: "Is there anything that you do not want to change?",
      symptomDescriptions: getSymptomDescriptions().join(' '),
    },
    step3: {
      header: formatSelectedIssues() || "Comfort Assessment",
      content: "Let's take a photo of the area you'd like to improve. This will help us provide better recommendations.",
    },
    step4: {
      header: "Results",
      content: "Based on your assessment, here are our recommendations:",
    },
  };

  const currentConfig = stepConfigs[currentStep];

  return (
    <>
      {/* Full-screen Loading Overlay - show when processing image */}
      {isProcessingImage && (
        <LoadingScreen message="Analyzing your space and generating recommendations..." />
      )}

      <motion.div
        key="fixmyhome-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen bg-gradient-yellow-to-pink flex flex-col items-center"
      >
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-30 w-full bg-yellow pt-4 sm:pt-6 pb-4 px-4 sm:px-6" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}>
        <div className="w-full max-w-md mx-auto flex items-center">
          <BackButton
            onBack={onBack}
            text={historyId ? "Back to History" : "Back to Home"}
            className="mb-0"
          />
        </div>
      </div>

      {/* Animated Card Container - With proper padding */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            {/* Header Card */}
            <HeaderCard className="mb-4 sm:mb-6 w-full">
              <div className="text-center">
                <h1 className="text-header text-dark-grey mb-2">
                  {currentConfig.header}
                </h1>
                {/* Symptom descriptions - only show on step2 */}
                {currentStep === 'step2' && (
                  <p className="text-big-text text-dark-grey opacity-80">
                    {currentConfig.symptomDescriptions}
                  </p>
                )}
              </div>
            </HeaderCard>

            {/* Content Card */}
            <ContentCard className="w-full">
              {/* Content text - show for all steps */}
              {currentConfig.content && (
                <p className="text-big-text text-dark-grey text-center mb-4 sm:mb-6 px-2 sm:px-0">
                  {currentConfig.content}
                </p>
              )}

              {/* Comments input - only show on step2 */}
              {currentStep === 'step2' && (
                <CommentsStep
                  comments={comments}
                  onCommentsChange={setComments}
                  noChangeComments={noChangeComments}
                  onNoChangeCommentsChange={setNoChangeComments}
                  secondQuestion={currentConfig.secondQuestion}
                />
              )}

              {/* Camera interface - only show on step3 */}
              {currentStep === 'step3' && !isProcessingImage && (
                <CameraStep
                  selectedIssues={selectedIssues}
                  comments={comments}
                  noChangeComments={noChangeComments}
                  onAnalysisComplete={handleAnalysisComplete}
                  onImageReady={handleImageReady}
                  onNext={handleNext}
                  onImageCaptured={handleImageCaptured}
                />
              )}


              {/* Results content - only show on step4 */}
              {currentStep === 'step4' && (
                <ResultsStep 
                  analysisResults={analysisResults} 
                  originalImage={originalImage}
                />
              )}

              {/* Issue Selection - Only show on step1 */}
              {currentStep === 'step1' && (
                <IssueSelectionStep
                  selectedIssues={selectedIssues}
                  onToggleIssue={toggleIssue}
                  issues={visibleIssues}
                />
              )}

              {/* Step Indicator - Show on all steps except step4 */}
              {currentStep !== 'step4' && (
                <StepIndicator 
                  currentStep={currentStep} 
                  className="mb-4 sm:mb-6" 
                />
              )}

              {/* Step Navigation - Hidden for step3 */}
              {currentStep !== 'step3' && (
                <StepNavigation
                  currentStep={currentStep}
                  onBack={handleBack}
                  onNext={handleNext}
                  onConfirm={handleStart}
                  isStep1Disabled={selectedIssues.length === 0}
                  isStep3Disabled={!hasImageSelected || isProcessingImage}
                />
              )}
            </ContentCard>

            {/* Back Button for step3 - placed outside ContentCard */}
            {currentStep === 'step3' && !isProcessingImage && (
              <Button
                variant="outline-light"
                onClick={handleBack}
                className="mt-4 sm:mt-6 w-full max-w-xs"
              >
                Back
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
}

export default FixMyHome;