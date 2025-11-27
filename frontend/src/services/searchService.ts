/**
 * Product Search Service
 *
 * Handles communication with the Product Search microservice through Vite proxy:
 * - /product-search-api -> Product Search service (port 8005)
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
 * Batch search for product sellers for multiple issues
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
