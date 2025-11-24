import React from 'react';

export type FeatureStep = 'step1' | 'step2' | 'step3' | 'step4';

interface StepIndicatorProps {
  currentStep: FeatureStep;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, className = '' }) => {
  const steps: FeatureStep[] = ['step1', 'step2', 'step3', 'step4'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {steps.map((_, index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-full ${
            index <= currentIndex ? 'bg-red' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

export default StepIndicator;