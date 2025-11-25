import React, { useState } from 'react';
import type { AnalysisResults } from '../utils/cameraUtils';

interface ResultsStepProps {
  analysisResults: AnalysisResults | null;
  originalImage?: string | null;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ analysisResults, originalImage }) => {
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'comparison' | 'recommendations'>('comparison');

  if (!analysisResults) {
    return (
      <div className="w-full mb-6 space-y-4">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <p className="text-big-text text-dark-grey text-center">
            No results available yet.
          </p>
        </div>
      </div>
    );
  }

  const { issues, transformedImageUrl } = analysisResults;
  const currentIssue = issues[currentIssueIndex];

  const handleNext = () => {
    if (currentIssueIndex < issues.length - 1) {
      setCurrentIssueIndex(currentIssueIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIssueIndex > 0) {
      setCurrentIssueIndex(currentIssueIndex - 1);
    }
  };

  return (
    <div className="w-full mb-6 space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="flex border-b-2 border-gray-300">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'bg-gray-100 text-dark-grey border-b-2 border-dark-grey -mb-[2px]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Before & After
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-gray-100 text-dark-grey border-b-2 border-dark-grey -mb-[2px]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Recommendations {issues && issues.length > 0 && `(${issues.length})`}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Before & After Tab */}
          {activeTab === 'comparison' && (
            <div>
              {(originalImage || transformedImageUrl) ? (
                <>
                  <h3 className="text-lg font-semibold text-dark-grey mb-3 text-center">
                    Before & After
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Image */}
                    {originalImage && (
                      <div className="text-center">
                        <h4 className="font-medium text-dark-grey mb-2">Before</h4>
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={originalImage}
                            alt="Original space before improvements"
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* After Image */}
                    {transformedImageUrl && (
                      <div className="text-center">
                        <h4 className="font-medium text-dark-grey mb-2">Improved Space</h4>
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={transformedImageUrl}
                            alt="Transformed space with improvements"
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Comparison showing recommended improvements
                  </p>
                </>
              ) : (
                <p className="text-center text-gray-500">No images available for comparison</p>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div>
              {/* Issues and Recommendations Carousel */}
              {issues && issues.length > 0 ? (
                <div className="space-y-4">
                  {/* Centered Recommendations Header */}
                  <h3 className="text-lg font-semibold text-dark-grey mb-3 text-center">
                    Recommendations ({issues.length})
                  </h3>

                  {/* Current Recommendation */}
                  <div className="space-y-4">
                    {/* Change Number */}
                    <h4 className="font-medium text-dark-grey text-center">
                      Change {currentIssueIndex + 1}
                    </h4>

                    {/* Recommendation Description */}
                    <div className="text-center">
                      <h5 className="font-semibold text-dark-grey mb-2">
                        {currentIssue.element}
                      </h5>
                      <p className="text-sm text-gray-700 mb-4">{currentIssue.recommendation}</p>

                      {/* Grey Divider Line */}
                      <div className="border-t-2 border-gray-300 my-4"></div>

                      {/* Product Recommendations Section */}
                      <h4 className="font-medium text-dark-grey mb-2">
                        Product Recommendations
                      </h4>
                      <p className="text-sm text-gray-700">
                        <span className="text-blue-600 underline cursor-not-allowed">
                          View recommended products for this change
                        </span>
                      </p>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex flex-col items-center space-y-3">
                      {/* Dot Indicators */}
                      <div className="flex space-x-3">
                        {issues.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentIssueIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              index === currentIssueIndex
                                ? 'bg-gray-800'
                                : 'bg-gray-300'
                            }`}
                            aria-label={`Go to recommendation ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* Previous/Next Buttons */}
                      <div className="flex space-x-4 items-center">
                        <button
                          onClick={handlePrevious}
                          disabled={currentIssueIndex === 0}
                          className={`p-2 rounded-full transition-colors ${
                            currentIssueIndex === 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-dark-grey hover:bg-gray-100'
                          }`}
                          aria-label="Previous recommendation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <span className="text-sm text-gray-600 min-w-[80px] text-center">
                          {currentIssueIndex + 1} / {issues.length}
                        </span>

                        <button
                          onClick={handleNext}
                          disabled={currentIssueIndex === issues.length - 1}
                          className={`p-2 rounded-full transition-colors ${
                            currentIssueIndex === issues.length - 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-dark-grey hover:bg-gray-100'
                          }`}
                          aria-label="Next recommendation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-dark-grey mb-3">
                    Analysis Complete
                  </h3>
                  <p className="text-sm text-gray-600">
                    No specific issues were identified in this space. Your environment
                    appears to be well-suited for accessibility and comfort.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark-grey mb-3 text-center">Next Steps</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>Review the recommended improvements above</li>
          <li>Consider implementing changes gradually</li>
        </ul>
      </div>
    </div>
  );
};

export default ResultsStep;