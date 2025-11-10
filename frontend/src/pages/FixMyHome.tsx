// src/pages/FixMyHome.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import HeaderCard from '../components/HeaderCard';
import ContentCard from '../components/ContentCard';
import Button from '../components/Button';
import DoubleButton from '../components/DoubleButton';

interface FixMyHomeProps {
  onBack: () => void;
}

type FeatureStep = 'welcome' | 'step1' | 'step2' | 'step3' | 'complete';

function FixMyHome({ onBack }: FixMyHomeProps) {
  const [currentStep, setCurrentStep] = useState<FeatureStep>('welcome');

  const handleStart = () => {
    setCurrentStep('step1');
  };

  const handleNext = () => {
    const steps: FeatureStep[] = ['welcome', 'step1', 'step2', 'step3', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: FeatureStep[] = ['welcome', 'step1', 'step2', 'step3', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Step configurations
  const stepConfigs = {
    welcome: {
      header: "What would you like to fix?",
      content: "You may pick one or more options:",
      buttonText: "Start Assessment",
      onButtonClick: handleStart
    },
    step1: {
      header: "Step 1: Safety Check",
      content: "First, let's check for any immediate safety concerns. Are there any tripping hazards, loose handrails, or electrical issues you've noticed?",
      buttonText: "Next",
      onButtonClick: handleNext
    },
    step2: {
      header: "Step 2: Comfort Assessment",
      content: "Now let's look at comfort. Are there areas that are too hot, cold, noisy, or difficult to access? Think about lighting, temperature, and ease of movement.",
      buttonText: "Next", 
      onButtonClick: handleNext
    },
    step3: {
      header: "Step 3: Organization",
      content: "Let's talk about organization. Are there items you frequently use that are hard to reach? Or clutter that makes spaces difficult to navigate?",
      buttonText: "Complete Assessment",
      onButtonClick: handleNext
    },
    complete: {
      header: "Assessment Complete!",
      content: "Great job! Based on your input, I've identified several areas for improvement. Would you like to see your personalized home improvement plan?",
      buttonText: "View Plan",
      onButtonClick: () => console.log("Show improvement plan")
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
      className="min-h-screen bg-gradient-yellow-to-pink flex flex-col items-center justify-center p-6"
    >
      {/* Back Button */}
      <div className="w-full max-w-md absolute top-30 left-6">
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

      {/* Animated Card Container */}
      <div className="w-full max-w-md">
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
              <h1 className="text-header text-dark-grey">{currentConfig.header}</h1>
            </HeaderCard>

            {/* Content Card */}
            <ContentCard>
              <p className="text-big-text text-dark-grey text-center mb-6">
                {currentConfig.content}
              </p>

              {/* Step Indicator */}
              {currentStep !== 'welcome' && currentStep !== 'complete' && (
                <div className="flex justify-center space-x-2 mb-6">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-3 h-3 rounded-full ${
                        step <= (['step1', 'step2', 'step3'].indexOf(currentStep) + 1)
                          ? 'bg-muted-purple'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Buttons */}
              {currentStep === 'welcome' || currentStep === 'complete' ? (
                // Single button for welcome and complete steps
                <Button 
                  variant={currentStep === 'complete' ? 'primary' : 'danger'} 
                  onClick={currentConfig.onButtonClick}
                >
                  {currentConfig.buttonText}
                </Button>
              ) : (
                // Double buttons for intermediate steps
                <DoubleButton
                  variant="primary"
                  leftButton={{
                    onClick: handleBack,
                    children: "Back"
                  }}
                  rightButton={{
                    onClick: currentConfig.onButtonClick,
                    children: currentConfig.buttonText
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