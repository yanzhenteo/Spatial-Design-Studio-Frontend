/**
 * Image Analysis and Transformation Service
 *
 * Handles communication with backend APIs through Vite proxy:
 * - /rag-api -> RAG-Langchain service (port 8001)
 * - /image-gen-api -> Picture Generation service (port 8002)
 * - /detection-api -> Detection service (port 8004)
 * - /product-search-api -> Product Search service (port 8005)
 */

import { batchSearchProductSellers } from './searchService';

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

/**
 * Analyze an image for dementia safety issues
 */
export async function analyzeImage(
  imageBlob: Blob,
  selectedIssues?: string[],
  comments?: string,
  noChangeComments?: string
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', imageBlob, 'captured-image.jpg');

  // Add user context if provided
  // Backend expects: { assessment: { selectedIssues, comments, noChangeComments } }
  if (selectedIssues || comments || noChangeComments) {
    const assessmentData: any = {};

    if (selectedIssues && selectedIssues.length > 0) {
      assessmentData.selectedIssues = selectedIssues;
    }

    if (comments && comments.trim()) {
      assessmentData.comments = comments.trim();
    }

    if (noChangeComments && noChangeComments.trim()) {
      assessmentData.noChangeComments = noChangeComments.trim();
    }

    const userContext = { assessment: assessmentData };
    formData.append('user_context', JSON.stringify(userContext));
    console.log('[analyzeImage] Sending user context:', userContext);
  }

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
 * Transform an image based on analysis JSON
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
 *
 * @param imageBlob - The captured or uploaded image
 * @param selectedIssues - Selected dementia-related issues
 * @param comments - User's additional comments
 * @param noChangeComments - Items the user doesn't want to change
 * @returns Analysis text, issues, and transformed image URL
 */
export async function analyzeAndTransformImage(
  imageBlob: Blob,
  selectedIssues?: string[],
  comments?: string,
  noChangeComments?: string
): Promise<AnalysisAndTransformResult> {
  try {
    // Step 1: Analyze the image with user context
    console.log('Step 1: Analyzing image with user context...');
    if (selectedIssues) console.log('- Selected issues:', selectedIssues);
    if (comments) console.log('- Comments:', comments);
    if (noChangeComments) console.log('- No-change comments:', noChangeComments);

    const analysisResult = await analyzeImage(imageBlob, selectedIssues, comments, noChangeComments);

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
    console.log(`Step 2: Running detection, transformation, and product search in parallel (${issues.length} issues)...`);
    console.log('Detection: Adding bounding boxes to issues...');
    console.log('Transformation: Generating improved image (this may take several minutes)...');
    console.log('Product Search: Finding sellers for recommended products...');

    const [detectionResult, transformResult, searchResult] = await Promise.all([
      // Step 2a: Add bounding boxes using detection service
      addBoundingBoxes(imageBlob, { issues: issues }),

      // Step 2b: Transform the image
      transformImage(imageBlob, { issues: issues }),

      // Step 2c: Search for product sellers (runs in parallel)
      batchSearchProductSellers(issues, 'Singapore', 5).catch(error => {
        console.warn('Product search failed, continuing without links:', error);
        return { total_issues: issues.length, processed: 0, results: issues };
      })
    ]);

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
