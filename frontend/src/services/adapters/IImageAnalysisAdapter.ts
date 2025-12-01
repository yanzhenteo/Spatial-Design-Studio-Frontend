/**
 * Image Analysis Adapter Interface
 *
 * Defines the contract that both local and Modal adapters must implement.
 * This ensures consistent API across different service implementations.
 */

import { Issue } from '../imageAnalysisService';

/**
 * Result from image transformation operation
 */
export interface TransformResult {
  success: boolean;
  transformedImageUrl: string | null;
  error?: string;
}

/**
 * Result from object detection operation
 */
export interface DetectionResult {
  success: boolean;
  analysis_with_boxes: {
    issues: Issue[];
  } | null;
  detected_count?: number;
  processing_time?: number;
  error?: string;
}

/**
 * Adapter interface for image analysis services
 */
export interface IImageAnalysisAdapter {
  /**
   * Transform an image based on analysis JSON
   *
   * @param imageBlob - The image to transform
   * @param analysisJson - Analysis JSON with issues and recommendations
   * @returns URL to the transformed image or error
   */
  transformImage(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<TransformResult>;

  /**
   * Add bounding box coordinates to analysis JSON
   *
   * @param imageBlob - The original image
   * @param analysisJson - Analysis JSON with issues
   * @returns Updated analysis with bounding box coordinates
   */
  addBoundingBoxes(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<DetectionResult>;
}
