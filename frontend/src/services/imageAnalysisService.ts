/**
 * Image Analysis and Transformation Service
 *
 * Handles communication with backend APIs through Vite proxy:
 * - /rag-api -> RAG-Langchain service (port 8001)
 * - /image-gen-api -> Picture Generation service (port 8002)
 * - /detection-api -> Detection service (port 8004)
 * - /product-search-api -> Product Search service (port 8005)
 *
 * Supports both sync and async (polling) modes:
 * - Async mode (default): For dev tunnels and production (avoids 60s timeout)
 * - Sync mode (fallback): For localhost development
 */

import { batchSearchProductSellers, batchSearchProductSellersAsync } from './searchService';

export interface BoundingBoxDetection {
  label: string;
  bbox: number[]; // [x_min, y_min, x_max, y_max] normalized (0-1)
  center: number[]; // [x, y] normalized (0-1)
  confidence: number;
}

export interface BoundingBoxCoordinates {
  format: string;
  detections: BoundingBoxDetection[];
  count: number;
}

export interface Issue {
  element: string;
  recommendation: string;
  prompt?: string;
  item?: string;
  category?: string;
  issue?: string;
  guideline_reference?: string;
  explanation?: string;
  bounding_box_coordinates?: BoundingBoxCoordinates;
  'Website name'?: string[];
  'Website link'?: string[];
  'Search query used'?: string;
}

export interface AnalysisResult {
  success: boolean;
  analysis_text: string;
  analysis_json: {
    issues: Issue[];
  } | null;
  error?: string;
}

export interface TransformResult {
  success: boolean;
  transformed_image_path: string | null;
  error?: string;
}

export interface DetectionResult {
  success: boolean;
  analysis_with_boxes: {
    issues: Issue[];
  } | null;
  detected_count?: number;
  processing_time?: number;
  error?: string;
}

export interface AnalysisAndTransformResult {
  success: boolean;
  analysisText: string;
  issues: Issue[];
  transformedImageUrl: string | null;
  error?: string;
}

export interface JobSubmitResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: string;
  result?: TransformResult;
  error?: string;
  created_at?: string;
  completed_at?: string;
}

/**
 * Helper: Poll a job until completion (with retry on errors)
 * Note: No client-side timeout - let browser handle it to accommodate slow dev tunnels
 */
async function pollJobUntilComplete(
  statusUrl: string,
  pollInterval: number = 2000,
  maxAttempts: number = 300 // 10 minutes max
): Promise<JobStatusResponse> {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 10; // Increased tolerance for tunnel latency

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // No timeout - let browser handle it (dev tunnel can be slow but will eventually respond)
      const response = await fetch(statusUrl);

      if (!response.ok) {
        console.warn(`Status check failed (${response.status}), retrying in ${pollInterval/1000}s...`);
        consecutiveErrors++;

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Failed to check job status after ${maxConsecutiveErrors} attempts: ${response.statusText}`);
        }

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }

      // Reset error counter on success
      consecutiveErrors = 0;

      const status: JobStatusResponse = await response.json();

      // Log progress if available
      if (status.progress) {
        console.log(`Job ${status.job_id}: ${status.progress}`);
      }

      // Check if job is complete
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      console.warn(`Polling error (attempt ${attempt + 1}/${maxAttempts}):`, error instanceof Error ? error.message : 'Unknown error', '- retrying...');
      consecutiveErrors++;

      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error(`Job polling failed after ${maxConsecutiveErrors} consecutive errors`);
      }

      // Wait longer on error (give tunnel time to recover)
      await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
    }
  }

  throw new Error('Job polling timed out - max attempts reached');
}

/**
 * Analyze an image for dementia safety issues
 */
export async function analyzeImage(imageBlob: Blob): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'captured-image.jpg');

  const response = await fetch('/rag-api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`RAG API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Transform an image based on analysis JSON (SYNC - for localhost)
 */
export async function transformImage(
  imageBlob: Blob,
  analysisJson: { issues: Issue[] }
): Promise<TransformResult> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'captured-image.jpg');
  formData.append('analysis_json', JSON.stringify(analysisJson));

  // This can take a long time (several minutes)
  const response = await fetch('/image-gen-api/transform', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Picture Generation API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Transform an image based on analysis JSON (ASYNC - with polling)
 * Recommended for dev tunnels and production to avoid 60s timeout
 */
export async function transformImageAsync(
  imageBlob: Blob,
  analysisJson: { issues: Issue[] }
): Promise<TransformResult> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'captured-image.jpg');
  formData.append('analysis_json', JSON.stringify(analysisJson));

  // Submit job
  console.log('Submitting transformation job (async mode)...');
  const submitResponse = await fetch('/image-gen-api/transform/async', {
    method: 'POST',
    body: formData,
  });

  if (!submitResponse.ok) {
    throw new Error(`Failed to submit transformation job: ${submitResponse.statusText}`);
  }

  const jobSubmit: JobSubmitResponse = await submitResponse.json();
  console.log(`Transformation job submitted: ${jobSubmit.job_id}`);
  console.log(jobSubmit.message);

  // Poll for completion (slower polling to avoid tunnel rate limiting)
  const jobStatus = await pollJobUntilComplete(
    `/image-gen-api/transform/status/${jobSubmit.job_id}`,
    5000, // Poll every 5 seconds (slower to avoid tunnel throttling)
    360 // Max 30 minutes (360 * 5s)
  );

  if (jobStatus.status === 'failed') {
    throw new Error(jobStatus.error || 'Transformation job failed');
  }

  if (!jobStatus.result) {
    throw new Error('Job completed but no result was returned');
  }

  return jobStatus.result;
}

/**
 * Add bounding box coordinates to analysis JSON using detection service
 */
export async function addBoundingBoxes(
  imageBlob: Blob,
  analysisJson: { issues: Issue[] }
): Promise<DetectionResult> {
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
}

/**
 * Download transformed image from the API
 */
export async function downloadTransformedImage(
  imagePath: string
): Promise<string> {
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

/**
 * Complete pipeline: Analyze and transform image
 * Uses ASYNC mode by default (with polling) to avoid dev tunnel timeouts
 * Falls back to SYNC mode if async endpoints are not available
 *
 * @param imageBlob - The captured or uploaded image
 * @returns Analysis text, issues, and transformed image URL
 */
export async function analyzeAndTransformImage(
  imageBlob: Blob
): Promise<AnalysisAndTransformResult> {
  try {
    // Step 1: Analyze the image
    console.log('Step 1: Analyzing image...');
    const analysisResult = await analyzeImage(imageBlob);

    if (!analysisResult.success || !analysisResult.analysis_json) {
      return {
        success: false,
        analysisText: analysisResult.analysis_text || '',
        issues: [],
        transformedImageUrl: null,
        error: analysisResult.error || 'Analysis failed or returned no JSON',
      };
    }

    const issues = analysisResult.analysis_json.issues || [];

    // Step 2: Run detection, transformation, and product search in parallel
    console.log(`Step 2: Running detection, transformation, and product search (ASYNC mode with polling)...`);
    console.log(`  - ${issues.length} issues to process`);
    console.log('Detection: Adding bounding boxes to issues...');
    console.log('Transformation: Generating improved image (this may take several minutes)...');
    console.log('Product Search: Finding sellers for recommended products...');

    // Try async mode first (recommended for tunnels/production)
    let transformResult: TransformResult;
    let searchResult: any;

    try {
      [transformResult, searchResult] = await Promise.all([
        // Step 2a: Transform the image (ASYNC with polling)
        transformImageAsync(imageBlob, { issues: issues }).catch(async (error) => {
          console.warn('Async transformation failed, falling back to sync mode:', error.message);
          return transformImage(imageBlob, { issues: issues });
        }),

        // Step 2b: Search for product sellers (ASYNC with polling)
        batchSearchProductSellersAsync(issues, 'Singapore', 5).catch(async (error) => {
          console.warn('Async product search failed, falling back to sync mode:', error.message);
          return batchSearchProductSellers(issues, 'Singapore', 5).catch(error => {
            console.warn('Product search failed entirely, continuing without links:', error);
            return { total_issues: issues.length, processed: 0, results: issues };
          });
        })
      ]);
    } catch (error) {
      console.error('Async operations failed, attempting sync fallback:', error);
      // Full fallback to sync mode
      [transformResult, searchResult] = await Promise.all([
        transformImage(imageBlob, { issues: issues }),
        batchSearchProductSellers(issues, 'Singapore', 5).catch(error => {
          console.warn('Product search failed, continuing without links:', error);
          return { total_issues: issues.length, processed: 0, results: issues };
        })
      ]);
    }

    // Step 2c: Add bounding boxes (run separately, doesn't timeout)
    const detectionResult = await addBoundingBoxes(imageBlob, { issues: issues });

    // Check detection result
    if (!detectionResult.success) {
      console.warn('Detection failed, continuing with original issues:', detectionResult.error);
    } else {
      console.log(`Detection complete! Found ${detectionResult.detected_count} total detections`);
    }

    // Check product search result
    if (searchResult.processed > 0) {
      console.log(`Product search complete! Found sellers for ${searchResult.processed}/${searchResult.total_issues} items`);
    } else {
      console.warn('Product search did not find any sellers');
    }

    // Check transformation result
    if (!transformResult.success || !transformResult.transformed_image_path) {
      return {
        success: false,
        analysisText: analysisResult.analysis_text,
        issues: detectionResult.success && detectionResult.analysis_with_boxes
          ? detectionResult.analysis_with_boxes.issues
          : issues,
        transformedImageUrl: null,
        error: transformResult.error || 'Transformation failed',
      };
    }

    // Step 3: Download the transformed image
    console.log('Step 3: Downloading transformed image...');
    const transformedImageUrl = await downloadTransformedImage(
      transformResult.transformed_image_path
    );

    // Step 4: Merge all results (detection + product search)
    console.log('Step 4: Merging detection and product search results...');

    // Start with issues from detection (if successful) or original issues
    let finalIssues = detectionResult.success && detectionResult.analysis_with_boxes
      ? detectionResult.analysis_with_boxes.issues
      : issues;

    // Merge product search results into final issues
    if (searchResult.results && searchResult.results.length > 0) {
      finalIssues = finalIssues.map((issue, index) => {
        const searchIssue = searchResult.results[index];
        if (searchIssue && searchIssue['Website name'] && searchIssue['Website link']) {
          return {
            ...issue,
            'Website name': searchIssue['Website name'],
            'Website link': searchIssue['Website link'],
            'Search query used': searchIssue['Search query used']
          };
        }
        return issue;
      });
    }

    return {
      success: true,
      analysisText: analysisResult.analysis_text,
      issues: finalIssues,
      transformedImageUrl: transformedImageUrl,
    };
  } catch (error) {
    console.error('Error in analyzeAndTransformImage:', error);
    return {
      success: false,
      analysisText: '',
      issues: [],
      transformedImageUrl: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
