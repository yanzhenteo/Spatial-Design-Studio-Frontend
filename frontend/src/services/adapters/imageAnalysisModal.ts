/**
 * Modal Image Analysis Adapter
 *
 * Implements the IImageAnalysisAdapter interface for Modal-hosted services.
 * Connects to Modal-hosted FastAPI services:
 * - Transform endpoint: /transform (returns base64 encoded image)
 * - Detection endpoint: /identify-changes (returns analysis with bounding boxes)
 */

import type { IImageAnalysisAdapter, TransformResult, DetectionResult } from './IImageAnalysisAdapter';
import type { Issue } from '../imageAnalysisService';

export class ModalImageAnalysisAdapter implements IImageAnalysisAdapter {
  private transformUrl: string;
  private identifyUrl: string;

  constructor() {
    // Get Modal service URLs from environment
    this.transformUrl = import.meta.env.VITE_MODAL_TRANSFORM_URL;
    this.identifyUrl = import.meta.env.VITE_MODAL_IDENTIFY_URL;

    if (!this.transformUrl || !this.identifyUrl) {
      console.error('Modal service URLs not configured in .env');
      throw new Error('Modal service URLs not configured. Check VITE_MODAL_TRANSFORM_URL and VITE_MODAL_IDENTIFY_URL in .env');
    }

    console.log('[ModalAdapter] Initialized with URLs:', {
      transform: this.transformUrl,
      identify: this.identifyUrl,
    });
  }

  /**
   * Transform an image using Modal service
   * Modal returns base64 encoded image directly in response
   */
  async transformImage(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<TransformResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'captured-image.jpg');
      formData.append('prompts', JSON.stringify(analysisJson));

      console.log('[ModalAdapter] Calling transform endpoint:', this.transformUrl);

      const response = await fetch(this.transformUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Modal Transform API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Modal returns: { status: "success", image: "<base64_string>" }
      if (result.status !== 'success' || !result.image) {
        return {
          success: false,
          transformedImageUrl: null,
          error: result.error || 'Transformation failed',
        };
      }

      // Decode base64 and create object URL
      const transformedImageUrl = this.base64ToObjectURL(result.image);

      console.log('[ModalAdapter] Transform successful, created object URL');

      return {
        success: true,
        transformedImageUrl,
      };
    } catch (error) {
      console.error('[ModalAdapter] Error in transformImage:', error);
      return {
        success: false,
        transformedImageUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add bounding boxes using Modal detection service
   * Modal endpoint: /identify-changes
   */
  async addBoundingBoxes(
    imageBlob: Blob,
    analysisJson: { issues: Issue[] }
  ): Promise<DetectionResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'original-image.jpg');
      formData.append('prompts', JSON.stringify(analysisJson));

      console.log('[ModalAdapter] Calling identify endpoint:', this.identifyUrl);

      const response = await fetch(this.identifyUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Modal Detection API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Modal returns: { analysis: { issues: [...] } }
      // Convert to the format expected by DetectionResult
      if (result.analysis && result.analysis.issues) {
        console.log('[ModalAdapter] Detection successful, found issues:', result.analysis.issues.length);

        // Count total detections
        const detected_count = result.analysis.issues.reduce((count: number, issue: Issue) => {
          return count + (issue.bounding_box_coordinates?.count || 0);
        }, 0);

        return {
          success: true,
          analysis_with_boxes: {
            issues: result.analysis.issues,
          },
          detected_count,
        };
      }

      return {
        success: false,
        analysis_with_boxes: null,
        error: 'No analysis data returned from Modal service',
      };
    } catch (error) {
      console.error('[ModalAdapter] Error in addBoundingBoxes:', error);
      return {
        success: false,
        analysis_with_boxes: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert base64 string to object URL
   * @private
   */
  private base64ToObjectURL(base64String: string): string {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob and object URL
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }
}
