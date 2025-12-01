/**
 * Local Image Analysis Adapter
 *
 * Implements the IImageAnalysisAdapter interface for local services.
 * Connects to local FastAPI services running on localhost through Vite proxy:
 * - /image-gen-api -> localhost:8002
 * - /detection-api -> localhost:8004
 */

import type { IImageAnalysisAdapter, TransformResult, DetectionResult } from './IImageAnalysisAdapter';
import type { Issue } from '../imageAnalysisService';

export class LocalImageAnalysisAdapter implements IImageAnalysisAdapter {
  /**
   * Transform an image using local service (port 8002)
   * Returns file path, then downloads the actual image
   */
  async transformImage(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<TransformResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'captured-image.jpg');
      formData.append('analysis_json', JSON.stringify(analysisJson));

      // Call local service through Vite proxy
      const response = await fetch('/image-gen-api/transform', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Picture Generation API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.transformed_image_path) {
        return {
          success: false,
          transformedImageUrl: null,
          error: result.error || 'Transformation failed',
        };
      }

      // Download the transformed image
      const transformedImageUrl = await this.downloadTransformedImage(
        result.transformed_image_path
      );

      return {
        success: true,
        transformedImageUrl,
      };
    } catch (error) {
      console.error('Error in local transformImage:', error);
      return {
        success: false,
        transformedImageUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add bounding boxes using local detection service (port 8004)
   */
  async addBoundingBoxes(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<DetectionResult> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'original-image.jpg');
      formData.append('analysis_json', JSON.stringify(analysisJson));

      const response = await fetch('/detection-api/identify', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Detection API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in local addBoundingBoxes:', error);
      return {
        success: false,
        analysis_with_boxes: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download transformed image from local service
   * @private
   */
  private async downloadTransformedImage(imagePath: string): Promise<string> {
    // Extract filename from path
    const filename = imagePath.split(/[/\\]/).pop();

    if (!filename) {
      throw new Error('Invalid image path');
    }

    const response = await fetch(`/image-gen-api/download/${filename}`);

    if (!response.ok) {
      throw new Error(`Failed to download transformed image: ${response.statusText}`);
    }

    // Convert to blob and create object URL
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}
