/**
 * Product Search Service
 *
 * Handles communication with the Product Search microservice through Vite proxy:
 * - /product-search-api -> Product Search service (port 8005)
 *
 * Supports both sync and async (polling) modes:
 * - Async mode (default): For dev tunnels and production (avoids 60s timeout)
 * - Sync mode (fallback): For localhost development
 */

export interface SellerInfo {
  website_name: string;
  website_link: string;
  reason: string;
}

export interface SearchResponse {
  success: boolean;
  needs_purchase: boolean;
  product_type?: string;
  original_query?: string;
  final_query?: string;
  attempted_queries: string[];
  sellers: SellerInfo[];
  message: string;
}

export interface BatchSearchRequest {
  issues: Array<{
    item?: string;
    recommendation?: string;
    [key: string]: any;
  }>;
  location?: string;
  target_sellers?: number;
  max_retries?: number;
}

export interface BatchSearchResponse {
  total_issues: number;
  processed: number;
  results: Array<any>;
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
  result?: BatchSearchResponse;
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
  maxAttempts: number = 150 // 5 minutes max for search
): Promise<JobStatusResponse> {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 10; // Increased tolerance for tunnel latency

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // No timeout - let browser handle it (dev tunnel can be slow but will eventually respond)
      const response = await fetch(statusUrl);

      if (!response.ok) {
        console.warn(`Search status check failed (${response.status}), retrying in ${pollInterval/1000}s...`);
        consecutiveErrors++;

        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(`Failed to check search job status after ${maxConsecutiveErrors} attempts: ${response.statusText}`);
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
        console.log(`Search Job ${status.job_id}: ${status.progress}`);
      }

      // Check if job is complete
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      console.warn(`Search polling error (attempt ${attempt + 1}/${maxAttempts}):`, error instanceof Error ? error.message : 'Unknown error', '- retrying...');
      consecutiveErrors++;

      if (consecutiveErrors >= maxConsecutiveErrors) {
        throw new Error(`Search job polling failed after ${maxConsecutiveErrors} consecutive errors`);
      }

      // Wait longer on error (give tunnel time to recover)
      await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
    }
  }

  throw new Error('Search job polling timed out - max attempts reached');
}

/**
 * Search for product sellers for a single item
 */
export async function searchProductSellers(
  itemName: string,
  recommendation: string,
  location: string = 'Singapore',
  targetSellers: number = 5
): Promise<SearchResponse> {
  const response = await fetch('/product-search-api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_name: itemName,
      recommendation: recommendation,
      location: location,
      target_sellers: targetSellers,
      max_retries: 3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Product Search API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Batch search for product sellers for multiple issues (SYNC - for localhost)
 *
 * This is the main function to use after detection service completes.
 * It processes all issues and adds product seller links to each one.
 */
export async function batchSearchProductSellers(
  issues: Array<any>,
  location: string = 'Singapore',
  targetSellers: number = 5
): Promise<BatchSearchResponse> {
  const requestBody: BatchSearchRequest = {
    issues: issues,
    location: location,
    target_sellers: targetSellers,
    max_retries: 3,
  };

  const response = await fetch('/product-search-api/search/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Product Search Batch API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Batch search for product sellers (ASYNC - with polling)
 * Recommended for dev tunnels and production to avoid 60s timeout
 */
export async function batchSearchProductSellersAsync(
  issues: Array<any>,
  location: string = 'Singapore',
  targetSellers: number = 5
): Promise<BatchSearchResponse> {
  const requestBody: BatchSearchRequest = {
    issues: issues,
    location: location,
    target_sellers: targetSellers,
    max_retries: 3,
  };

  // Submit job
  console.log('Submitting batch search job (async mode)...');
  const submitResponse = await fetch('/product-search-api/search/batch/async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!submitResponse.ok) {
    throw new Error(`Failed to submit batch search job: ${submitResponse.statusText}`);
  }

  const jobSubmit: JobSubmitResponse = await submitResponse.json();
  console.log(`Batch search job submitted: ${jobSubmit.job_id}`);
  console.log(jobSubmit.message);

  // Poll for completion (slower polling to avoid tunnel rate limiting)
  const jobStatus = await pollJobUntilComplete(
    `/product-search-api/search/batch/status/${jobSubmit.job_id}`,
    5000, // Poll every 5 seconds (slower to avoid tunnel throttling)
    180 // Max 15 minutes (180 * 5s)
  );

  if (jobStatus.status === 'failed') {
    throw new Error(jobStatus.error || 'Batch search job failed');
  }

  if (!jobStatus.result) {
    throw new Error('Job completed but no result was returned');
  }

  return jobStatus.result;
}

/**
 * Check if the product search service is healthy
 */
export async function checkSearchServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch('/product-search-api/health', {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Product search service health check failed:', error);
    return false;
  }
}
