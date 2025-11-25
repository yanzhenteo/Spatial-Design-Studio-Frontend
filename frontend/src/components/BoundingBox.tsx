import React from 'react';
import type { BoundingBoxDetection } from '../services/imageAnalysisService';

interface BoundingBoxProps {
  detections: BoundingBoxDetection[];
  containerWidth: number;
  containerHeight: number;
  color?: string;
  showLabels?: boolean;
}

/**
 * BoundingBox Component
 *
 * Renders bounding boxes on images using normalized coordinates (0-1).
 * Maps normalized coordinates to actual pixel positions within the container.
 *
 * @param detections - Array of bounding box detections with normalized coordinates
 * @param containerWidth - Width of the image container in pixels
 * @param containerHeight - Height of the image container in pixels
 * @param color - Border color for bounding boxes (default: red)
 * @param showLabels - Whether to show detection labels (default: true)
 */
const BoundingBox: React.FC<BoundingBoxProps> = ({
  detections,
  containerWidth,
  containerHeight,
  color = '#ef4444', // red-500
  showLabels = true,
}) => {
  if (!detections || detections.length === 0) {
    return null;
  }

  return (
    <>
      {detections.map((detection, index) => {
        // Extract normalized coordinates [x_min, y_min, x_max, y_max]
        const [x_min_norm, y_min_norm, x_max_norm, y_max_norm] = detection.bbox;

        // Convert normalized coordinates to pixel positions
        const x_min = x_min_norm * containerWidth;
        const y_min = y_min_norm * containerHeight;
        const x_max = x_max_norm * containerWidth;
        const y_max = y_max_norm * containerHeight;

        // Calculate width and height
        const width = x_max - x_min;
        const height = y_max - y_min;

        return (
          <div
            key={`bbox-${index}`}
            className="absolute pointer-events-none"
            style={{
              left: `${x_min}px`,
              top: `${y_min}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: `2px solid ${color}`,
              borderRadius: '4px',
              boxShadow: `0 0 0 1px rgba(0, 0, 0, 0.3), 0 0 8px ${color}80`,
            }}
          >
            {/* Label */}
            {showLabels && detection.label && (
              <div
                className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium text-white rounded"
                style={{
                  backgroundColor: color,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {detection.label}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default BoundingBox;
