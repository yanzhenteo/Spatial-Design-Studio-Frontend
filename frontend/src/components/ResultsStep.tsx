import React from 'react';

const ResultsStep: React.FC = () => {
  return (
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
  );
};

export default ResultsStep;