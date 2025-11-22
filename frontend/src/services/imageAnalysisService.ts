/**
 * Image Analysis and Transformation Service
 *
 * Handles communication with backend APIs through Vite proxy:
 * - /rag-api -> RAG-Langchain service (port 8001)
 * - /image-gen-api -> Picture Generation service (port 8002)
 */

export interface Issue {
  element: string;
  recommendation: string;
  prompt?: string;
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

    // Step 2: Transform the image
    console.log(`Step 2: Transforming image (${issues.length} issues)...`);
    console.log('This may take several minutes...');

    const transformResult = await transformImage(imageBlob, {
      issues: issues,
    });

    if (!transformResult.success || !transformResult.transformed_image_path) {
      return {
        success: false,
        analysisText: analysisResult.analysis_text,
        issues: issues,
        transformedImageUrl: null,
        error: transformResult.error || 'Transformation failed',
      };
    }

    // Step 3: Download the transformed image
    console.log('Step 3: Downloading transformed image...');
    const transformedImageUrl = await downloadTransformedImage(
      transformResult.transformed_image_path
    );

    return {
      success: true,
      analysisText: analysisResult.analysis_text,
      issues: issues,
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
