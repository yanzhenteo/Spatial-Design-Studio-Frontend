import React from 'react';
import Button from './Button';
import DoubleButton from './DoubleButton';
import { type FeatureStep } from './StepIndicator';

interface StepNavigationProps {
  currentStep: FeatureStep;
  onBack: () => void;
  onNext: () => void;
  onConfirm?: () => void;
  isStep1Disabled?: boolean;
  isStep3Disabled?: boolean;
  className?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onBack,
  onNext,
  onConfirm,
  isStep1Disabled = false,
  className = ''
}) => {
  // Step configurations for button text and click handlers
  const stepButtonConfigs = {
    step1: {
      buttonText: 'Confirm',
      onClick: onConfirm || onNext
    },
    step2: {
      buttonText: 'Next',
      onClick: onNext
    },
    step3: {
      buttonText: 'Next', 
      onClick: onNext
    },
    step4: {
      buttonText: 'Complete',
      onClick: onNext
    }
  };

  const currentConfig = stepButtonConfigs[currentStep];

  // Special case for step3 - no navigation buttons inside content card
  if (currentStep === 'step3') {
    return null;
  }

  // Single button steps (step1 and step4)
  if (currentStep === 'step1' || currentStep === 'step4') {
    return (
      <Button 
        variant="danger" 
        onClick={currentConfig.onClick}
        disabled={currentStep === 'step1' && isStep1Disabled}
        className={className}
      >
        {currentConfig.buttonText}
      </Button>
    );
  }

  // Double buttons for step2
  return (
    <DoubleButton
      variant="danger"
      leftButton={{
        onClick: onBack,
        children: "Back"
      }}
      rightButton={{
        onClick: currentConfig.onClick,
        children: currentConfig.buttonText
      }}
      className={className}
    />
  );
};

export default StepNavigation;