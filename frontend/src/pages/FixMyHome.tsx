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
import { fetchIssuesFromLastConversation } from '../services/conversationIssueService';
import type { AnalysisResults } from '../utils/cameraUtils';

interface FixMyHomeProps {
  onBack: () => void;
}

// Add this interface for step configurations
interface StepConfig {
  header: string;
  content: string;
  secondQuestion?: string;
  symptomDescriptions?: string;
}

function FixMyHome({ onBack }: FixMyHomeProps) {
  const [currentStep, setCurrentStep] = useState<FeatureStep>('step1');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [visibleIssues, setVisibleIssues] = useState<string[]>(ALL_ISSUES);
  const [comments, setComments] = useState('');
  const [noChangeComments, setNoChangeComments] = useState('');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [hasImageSelected, setHasImageSelected] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  // Use ref instead of state to avoid triggering re-renders
  const imageUploadFnRef = useRef<(() => Promise<void>) | null>(null);

  // Handle analysis completion from camera/gallery upload
  const handleAnalysisComplete = useCallback((results: AnalysisResults) => {
    console.log('Analysis complete, moving to step 4');
    console.log('Results:', results);
    console.log('Setting isProcessingImage to false');
    console.log('Setting currentStep to step4');
    setAnalysisResults(results);
    setIsProcessingImage(false);
    setCurrentStep('step4');
  }, []);

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

  // PRELOAD ISSUES FROM LAST MEMORY BOT CONVERSATION
  useEffect(() => {
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
  }, []);

  // Step configurations
  const stepConfigs: Record<FeatureStep, StepConfig> = {
    step1: {
      header: "What would you like to fix?",
      content: "You may pick one or more options:",
    },
    step2: {
      header: formatSelectedIssues() || "Symptom Overview",
      content: "Any further comments or elaboration you would like to add?",
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
    <motion.div
      key="fixmyhome-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gradient-yellow-to-pink flex flex-col items-center p-6"
    >
      {/* Back Button Component */}
      <BackButton onBack={onBack} />

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
                  {currentConfig.symptomDescriptions}
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
                  onAnalysisComplete={handleAnalysisComplete}
                  onImageReady={handleImageReady}
                  onNext={handleNext}
                  onImageCaptured={handleImageCaptured}
                />
              )}

              {/* Loading screen - show between step3 and step4 */}
              {currentStep === 'step3' && isProcessingImage && (
                <div className="w-full mb-6 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red mb-4"></div>
                    <p className="text-big-text text-dark-grey text-center">
                      Processing your image...
                    </p>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      This may take several minutes
                    </p>
                  </div>
                </div>
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
                  className="mb-6" 
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
                className="mt-6"
              >
                Back
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default FixMyHome;