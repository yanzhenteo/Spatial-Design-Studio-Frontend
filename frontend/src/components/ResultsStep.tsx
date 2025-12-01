import React, { useState, useRef } from 'react';
import type { AnalysisResults } from '../utils/cameraUtils';
import BoundingBoxMask from './BoundingBoxMask';
import LinkPreviewCard from './LinkPreviewCard';

interface ResultsStepProps {
  analysisResults: AnalysisResults | null;
  originalImage?: string | null;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ analysisResults, originalImage }) => {
  // Carousel: -1 = Overall (no mask), 0+ = Individual issues (with mask)
  const [carouselIndex, setCarouselIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<'comparison' | 'recommendations'>('comparison');
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage (0-100)
  const [comparisonImageDimensions, setComparisonImageDimensions] = useState({ width: 0, height: 0 });
  const [recommendationImageDimensions, setRecommendationImageDimensions] = useState({ width: 0, height: 0 });

  const comparisonImageRef = useRef<HTMLImageElement>(null);
  const recommendationImageRef = useRef<HTMLImageElement>(null);

  if (!analysisResults) {
    return (
      <div className="w-full mb-6 space-y-4">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6">
          <p className="text-big-text text-dark-grey text-center">
            No results available yet.
          </p>
        </div>
      </div>
    );
  }

  const { issues, transformedImageUrl } = analysisResults;

  // Get current issue based on carousel index (-1 = Overall, 0+ = specific issue)
  const isOverallView = carouselIndex === -1;
  const currentIssue = carouselIndex >= 0 ? issues[carouselIndex] : null;

  const handleNext = () => {
    if (carouselIndex < issues.length - 1) {
      setCarouselIndex(carouselIndex + 1);
    }
  };

  const handlePrevious = () => {
    // In Comparison tab: can go back to -1 (Overall)
    // In Recommendations tab: can only go to 0 (first issue)
    const minIndex = activeTab === 'comparison' ? -1 : 0;
    if (carouselIndex > minIndex) {
      setCarouselIndex(carouselIndex - 1);
    }
  };

  const handleTabSwitch = (tab: 'comparison' | 'recommendations') => {
    setActiveTab(tab);
    // Reset carousel to appropriate starting position
    if (tab === 'comparison') {
      setCarouselIndex(-1); // Start at Overall view
    } else {
      setCarouselIndex(0); // Start at first issue
    }
  };

  return (
    <div className="w-full mb-6 space-y-4 px-2 sm:px-0">
      {/* Tab Navigation - FIXED: Added responsive font size */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="flex border-b-2 border-gray-300">
          <button
            onClick={() => handleTabSwitch('comparison')}
            className={`flex-1 px-3 sm:px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'bg-gray-100 text-dark-grey border-b-2 border-dark-grey -mb-[2px]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-xs sm:text-sm">Comparison</span>
          </button>
          <button
            onClick={() => handleTabSwitch('recommendations')}
            className={`flex-1 px-3 sm:px-4 py-3 text-center font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-gray-100 text-dark-grey border-b-2 border-dark-grey -mb-[2px]'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-xs sm:text-sm">
              Recommendations {issues && issues.length > 0 && `(${issues.length})`}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4">
          {/* Comparison Tab with Interactive Slider */}
          {activeTab === 'comparison' && (
            <div>
              {(originalImage && transformedImageUrl) ? (
                <>
                  <h3 className="text-lg font-semibold text-dark-grey mb-3 text-center">
                    Comparison
                  </h3>

                  {/* Interactive Before/After Slider - NO CHANGES TO IMAGE/MASKING */}
                  <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                    {/* Before Image (Full Background) - This sets the container height */}
                    <img
                      ref={comparisonImageRef}
                      src={originalImage}
                      alt="Original space before improvements"
                      className="w-full h-auto max-h-[400px] object-contain pointer-events-none select-none"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setComparisonImageDimensions({
                          width: img.clientWidth,
                          height: img.clientHeight
                        });
                      }}
                    />

                    {/* After Image (Clipped by slider) - Absolute positioned overlay */}
                    <div
                      className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={transformedImageUrl}
                        alt="Transformed space with improvements"
                        className="w-full h-auto max-h-[400px] object-contain select-none"
                      />
                    </div>

                    {/* Inverse Mask for Current Issue (only show when not in Overall view) */}
                    {!isOverallView && currentIssue?.bounding_box_coordinates && comparisonImageDimensions.width > 0 && (
                      <BoundingBoxMask
                        detections={currentIssue.bounding_box_coordinates.detections}
                        containerWidth={comparisonImageDimensions.width}
                        containerHeight={comparisonImageDimensions.height}
                      />
                    )}

                    {/* Slider Handle */}
                    <div
                      className="absolute top-0 h-full w-1 bg-white shadow-lg pointer-events-none z-10"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="flex gap-1">
                          <div className="w-0.5 h-4 bg-gray-400"></div>
                          <div className="w-0.5 h-4 bg-gray-400"></div>
                        </div>
                      </div>
                    </div>

                    {/* Invisible overlay for dragging */}
                    <div
                      className="absolute top-0 left-0 w-full h-full cursor-ew-resize z-20"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const container = e.currentTarget;
                        const rect = container.getBoundingClientRect();

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const x = moveEvent.clientX - rect.left;
                          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                          setSliderPosition(percentage);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      onTouchStart={(e) => {
                        const container = e.currentTarget;
                        const rect = container.getBoundingClientRect();

                        const handleTouchMove = (moveEvent: TouchEvent) => {
                          // moveEvent.preventDefault();
                          if (moveEvent.touches.length > 0) {
                            const x = moveEvent.touches[0].clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setSliderPosition(percentage);
                          }
                        };

                        const handleTouchEnd = () => {
                          document.removeEventListener('touchmove', handleTouchMove);
                          document.removeEventListener('touchend', handleTouchEnd);
                        };

                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                        document.addEventListener('touchend', handleTouchEnd);
                      }}
                    />
                  </div>

                  {/* Labels below image */}
                  <div className="flex justify-between items-center mt-2 px-2">
                    <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">Before</span>
                    <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">After</span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 mt-1 text-center">
                    Drag the slider to compare before and after
                  </p>

                  {/* Issue Information Carousel */}
                  {issues && issues.length > 0 && (
                    <div className="mt-4 bg-white border-2 border-gray-300 rounded-lg p-3 sm:p-4">
                      {isOverallView ? (
                        <>
                          <h4 className="font-medium text-dark-grey text-center mb-3 text-sm sm:text-base">
                            Overall Analysis
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 text-center">
                            {issues.length} issue{issues.length !== 1 ? 's' : ''} detected across the space.
                            Navigate through the carousel to see individual details.
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-medium text-dark-grey text-center mb-3 text-sm sm:text-base">
                            Detected Issue {carouselIndex + 1} of {issues.length}
                          </h4>

                          {/* Issue Details */}
                          <div className="space-y-2 sm:space-y-3">
                            {currentIssue?.item && (
                              <div>
                                <span className="font-semibold text-dark-grey text-sm sm:text-base">Item: </span>
                                <span className="text-gray-700 text-sm sm:text-base">{currentIssue.item}</span>
                              </div>
                            )}

                            {currentIssue?.recommendation && (
                              <div>
                                <span className="font-semibold text-dark-grey text-sm sm:text-base">Recommendation: </span>
                                <span className="text-gray-700 text-sm sm:text-base">{currentIssue.recommendation}</span>
                              </div>
                            )}

                            {currentIssue?.explanation && (
                              <div>
                                <span className="font-semibold text-dark-grey text-sm sm:text-base">Explanation: </span>
                                <span className="text-gray-700 text-sm sm:text-base">{currentIssue.explanation}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Navigation Controls */}
                      <div className="flex flex-col items-center space-y-3 mt-4">
                        {/* Dot Indicators - Include Overall (-1) as first dot */}
                        <div className="flex space-x-2 sm:space-x-3">
                          {/* Overall dot */}
                          <button
                            onClick={() => setCarouselIndex(-1)}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                              carouselIndex === -1
                                ? 'bg-gray-800'
                                : 'bg-gray-300'
                            }`}
                            aria-label="Go to overall view"
                          />
                          {/* Individual issue dots */}
                          {issues.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCarouselIndex(index)}
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                                index === carouselIndex
                                  ? 'bg-gray-800'
                                  : 'bg-gray-300'
                              }`}
                              aria-label={`Go to issue ${index + 1}`}
                            />
                          ))}
                        </div>

                        {/* Previous/Next Buttons */}
                        <div className="flex space-x-3 sm:space-x-4 items-center">
                          <button
                            onClick={handlePrevious}
                            disabled={carouselIndex === -1}
                            className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                              carouselIndex === -1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-dark-grey hover:bg-gray-100'
                            }`}
                            aria-label="Previous issue"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          <span className="text-xs sm:text-sm text-gray-600 min-w-16 sm:min-w-20 text-center">
                            {isOverallView ? 'Overall' : `${carouselIndex + 1} / ${issues.length}`}
                          </span>

                          <button
                            onClick={handleNext}
                            disabled={carouselIndex === issues.length - 1}
                            className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                              carouselIndex === issues.length - 1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-dark-grey hover:bg-gray-100'
                            }`}
                            aria-label="Next issue"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 text-sm sm:text-base">No images available for comparison</p>
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

                  {/* After Image - Unified Container - NO CHANGES TO IMAGE/MASKING */}
                  {transformedImageUrl && (
                    <>
                      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          ref={recommendationImageRef}
                          src={transformedImageUrl}
                          alt="Improved space with recommendations"
                          className="w-full h-auto max-h-[400px] object-contain"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            setRecommendationImageDimensions({
                              width: img.clientWidth,
                              height: img.clientHeight
                            });
                          }}
                        />

                        {/* Inverse Mask for Current Issue */}
                        {currentIssue?.bounding_box_coordinates && recommendationImageDimensions.width > 0 && (
                          <BoundingBoxMask
                            detections={currentIssue.bounding_box_coordinates.detections}
                            containerWidth={recommendationImageDimensions.width}
                            containerHeight={recommendationImageDimensions.height}
                          />
                        )}
                      </div>
                      {/* After label below image */}
                      <div className="flex justify-end mt-2 px-2">
                        <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">After</span>
                      </div>
                    </>
                  )}

                  {/* Current Recommendation - Compact Header */}
                  <div className="space-y-4">
                    {/* Recommendation Header (Compact) */}
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">Change {carouselIndex + 1} of {issues.length}</span>
                          </div>
                          <h5 className="font-semibold text-dark-grey text-sm mb-1">
                            {currentIssue?.element}
                          </h5>
                          <p className="text-xs text-gray-600 line-clamp-2">{currentIssue?.recommendation}</p>
                        </div>

                        {/* Navigation arrows inline */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={handlePrevious}
                            disabled={carouselIndex <= 0}
                            className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                              carouselIndex <= 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-dark-grey hover:bg-gray-200'
                            }`}
                            aria-label="Previous recommendation"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleNext}
                            disabled={carouselIndex >= issues.length - 1}
                            className={`p-1 sm:p-1.5 rounded-full transition-colors ${
                              carouselIndex >= issues.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-dark-grey hover:bg-gray-200'
                            }`}
                            aria-label="Next recommendation"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Dot indicators */}
                      <div className="flex justify-center space-x-1 sm:space-x-2 mt-3">
                        {issues.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCarouselIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              index === carouselIndex
                                ? 'bg-gray-800 w-4 sm:w-6'
                                : 'bg-gray-300 hover:bg-gray-400 w-2'
                            }`}
                            aria-label={`Go to recommendation ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Where to Buy Section - Scrollable Cards */}
                    <div>
                      <h4 className="font-semibold text-dark-grey mb-3 text-center text-sm sm:text-base">
                        Where to Buy
                      </h4>

                      {currentIssue?.['Website link'] && currentIssue?.['Website name'] &&
                       currentIssue['Website link'].length > 0 ? (
                        <div className="space-y-3">
                          {/* Scrollable card container */}
                          <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {currentIssue['Website link'].map((link, idx) => (
                              <LinkPreviewCard
                                key={idx}
                                url={link}
                                websiteName={currentIssue['Website name']?.[idx] || `Seller ${idx + 1}`}
                                index={idx}
                              />
                            ))}
                          </div>

                          {/* Seller count */}
                          <p className="text-xs text-center text-gray-500 mt-2">
                            Found {currentIssue['Website link'].length} seller{currentIssue['Website link'].length !== 1 ? 's' : ''} in Singapore
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <p className="text-xs sm:text-sm text-gray-500">
                            No purchase needed or sellers not found
                          </p>
                        </div>
                      )}
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
    </div>
  );
};

export default ResultsStep;