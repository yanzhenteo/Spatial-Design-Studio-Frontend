import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import Button from '../components/Button';
import DoubleButton from '../components/DoubleButton';
import StepIndicator, { type FeatureStep } from '../components/StepIndicator';
import BackButton from '../components/BackButton';
import CameraStep from '../components/CameraStep';
import ResultsStep from '../components/ResultsStep';
import ProductRecommendationsStep from '../components/ProductRecommendationsStep';
import IssueSelectionStep from '../components/IssueSelectionStep';
import CommentsStep from '../components/CommentsStep';

interface FixMyHomeProps {
  onBack: () => void;
}

function FixMyHome({ onBack }: FixMyHomeProps) {
  const [currentStep, setCurrentStep] = useState<FeatureStep>('step1');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [comments, setComments] = useState('');

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
      onButtonClick: handleNext
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

              {/* Comments input - only show on step2 */}
              {currentStep === 'step2' && (
                <CommentsStep
                  comments={comments}
                  onCommentsChange={setComments}
                />
              )}

              {/* Camera interface - only show on step3 */}
              {currentStep === 'step3' && (
                <CameraStep
                  selectedIssues={selectedIssues}
                  comments={comments}
                  onNext={handleNext}
                />
              )}

              {/* Results content - only show on step4 */}
              {currentStep === 'step4' && (
                <ResultsStep />
              )}

              {/* Product recommendations - only show on recommendations step */}
              {currentStep === 'recommendations' && (
                <ProductRecommendationsStep currentStep={currentStep}
                />
              )}

              {/* Issue Selection - Only show on step1 */}
              {currentStep === 'step1' && (
                <IssueSelectionStep
                  selectedIssues={selectedIssues}
                  onToggleIssue={toggleIssue}
                />
              )}

              {/* Step Indicator - Show on all steps except recommendations (now handled inside ProductRecommendationsStep) */}
              {currentStep !== 'recommendations' && currentStep !== 'step4' && (
                <StepIndicator 
                  currentStep={currentStep} 
                  className="mb-6" 
                />
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
                    disabled: false
                  }}
                />
              )}
            </ContentCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default FixMyHome;