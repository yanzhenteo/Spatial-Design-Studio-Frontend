import React from 'react';
import type { AnalysisResults } from '../utils/cameraUtils';

interface ResultsStepProps {
  analysisResults: AnalysisResults | null;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ analysisResults }) => {
  // If no results, show a message (loading is now handled in FixMyHome)
  if (!analysisResults) {
    return (
      <div className="w-full mb-6 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-big-text text-dark-grey text-center">
            No results available yet.
          </p>
        </div>
      </div>
    );
  }

  const { issues, transformedImageUrl } = analysisResults;

  return (
    <div className="w-full mb-6 space-y-4">
      {/* Transformed Image Display */}
      {transformedImageUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-dark-grey mb-3">
            Improved Space
          </h3>
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={transformedImageUrl}
              alt="Transformed space with improvements"
              className="w-full h-auto"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Preview of recommended improvements
          </p>
        </div>
      )}

      {/* Issues and Recommendations */}
      {issues && issues.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-dark-grey mb-3">
            Recommendations ({issues.length})
          </h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <h4 className="font-medium text-dark-grey mb-1">
                  {issue.element}
                </h4>
                <p className="text-sm text-gray-700">{issue.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues found */}
      {(!issues || issues.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-dark-grey mb-3">
            Analysis Complete
          </h3>
          <p className="text-sm text-gray-600">
            No specific issues were identified in this space. Your environment
            appears to be well-suited for accessibility and comfort.
          </p>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-grey mb-3">Next Steps</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>Review the recommended improvements above</li>
          <li>Continue to see product recommendations</li>
          <li>Consider implementing changes gradually</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultsStep;