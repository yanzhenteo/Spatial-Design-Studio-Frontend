import React from 'react';
import type { BoundingBoxDetection } from '../services/imageAnalysisService';

interface BoundingBoxMaskProps {
  detections: BoundingBoxDetection[];
  containerWidth: number;
  containerHeight: number;
  opacity?: number; // 0-1, default 0.35 (35% black overlay)
}

/**
 * BoundingBoxMask Component
 *
 * Creates an inverse mask effect:
 * - Overlays a dark semi-transparent layer over the ENTIRE image
 * - Makes bounding box areas transparent (cutting holes in the overlay)
 * - Result: Detected areas are bright, rest is dimmed
 * - Overlapping boxes naturally merge into one bright area
 *
 * @param detections - Array of bounding box detections with normalized coordinates
 * @param containerWidth - Width of the image container in pixels
 * @param containerHeight - Height of the image container in pixels
 * @param opacity - Opacity of the dark overlay (0-1, default 0.35)
 */
const BoundingBoxMask: React.FC<BoundingBoxMaskProps> = ({
  detections,
  containerWidth,
  containerHeight,
  opacity = 0.50,
}) => {
  if (!detections || detections.length === 0 || containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  // Create an SVG mask that cuts out holes for bounding boxes
  const maskId = `bbox-mask-${Math.random().toString(36).substring(2, 11)}`;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ zIndex: 5 }}
    >
      <defs>
        <mask id={maskId}>
          {/* White rectangle = visible, Black rectangles = transparent (cutouts) */}
          <rect x="0" y="0" width={containerWidth} height={containerHeight} fill="white" />

          {/* Black rectangles for each bounding box (these areas will be cut out) */}
          {detections.map((detection, index) => {
            const [x_min_norm, y_min_norm, x_max_norm, y_max_norm] = detection.bbox;

            const x = x_min_norm * containerWidth;
            const y = y_min_norm * containerHeight;
            const width = (x_max_norm - x_min_norm) * containerWidth;
            const height = (y_max_norm - y_min_norm) * containerHeight;

            return (
              <rect
                key={`mask-${index}`}
                x={x}
                y={y}
                width={width}
                height={height}
                fill="black"
              />
            );
          })}
        </mask>
      </defs>

      {/* Semi-transparent overlay with mask applied */}
      <rect
        x="0"
        y="0"
        width={containerWidth}
        height={containerHeight}
        fill={`rgba(0, 0, 0, ${opacity})`}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
};

export default BoundingBoxMask;
