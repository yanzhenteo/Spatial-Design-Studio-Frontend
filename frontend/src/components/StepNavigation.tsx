import React from 'react';
import Button from './Button';
import DoubleButton from './DoubleButton';
import { type FeatureStep } from './StepIndicator';

interface StepNavigationProps {
  currentStep: FeatureStep;
  onBack: () => void;
  onNext: () => void;
  onConfirm?: () => void;
  onEnd?: () => void;
  isStep1Disabled?: boolean;
  className?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onBack,
  onNext,
  onConfirm,
  onEnd,
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
    },
    recommendations: {
      buttonText: 'End',
      onClick: onEnd || onNext
    }
  };

  const currentConfig = stepButtonConfigs[currentStep];

  // Single button steps (step1 and recommendations)
  if (currentStep === 'step1' || currentStep === 'recommendations') {
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

  // Single button for step4
  if (currentStep === 'step4') {
    return (
      <Button 
        variant="danger" 
        onClick={currentConfig.onClick}
        className={className}
      >
        {currentConfig.buttonText}
      </Button>
    );
  }

  // Double buttons for intermediate steps (step2 and step3)
  return (
    <DoubleButton
      variant="danger"
      leftButton={{
        onClick: onBack,
        children: "Back"
      }}
      rightButton={{
        onClick: currentConfig.onClick,
        children: currentConfig.buttonText,
        disabled: false
      }}
      className={className}
    />
  );
};

export default StepNavigation;