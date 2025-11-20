import React from 'react';
import StepIndicator, { type FeatureStep } from '../components/StepIndicator';

interface ProductRecommendationsStepProps {
  currentStep: FeatureStep;
}

const ProductRecommendationsStep: React.FC<ProductRecommendationsStepProps> = ({ 
  currentStep 
}) => {
  return (
    <>
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

      {/* Step Indicator - Show on recommendations step */}
      <StepIndicator 
        currentStep={currentStep} 
        className="mb-6" 
      />
    </>
  );
};

export default ProductRecommendationsStep;