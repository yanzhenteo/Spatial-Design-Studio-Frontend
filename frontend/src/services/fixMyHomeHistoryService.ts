/**
 * Service for managing Fix My Home history
 * Handles saving and retrieving Fix My Home generation results
 */

const API_BASE_URL = '/api/fix-my-home';

/**
 * Gets the authentication token from localStorage
 * @returns The auth token or throws an error if not found
 */
function getAuthToken(): string {
  const userAuth = localStorage.getItem('userAuth');
  if (!userAuth) {
    throw new Error('User not authenticated');
  }
  const { token } = JSON.parse(userAuth);
  return token;
}

export interface SaveFixMyHomeResultRequest {
  selectedIssues: string[];
  comments: string;
  noChangeComments: string;
  originalImage: string; // base64 data URL
  transformedImage: string | null; // base64 data URL or null
  analysisText: string;
  analysisJson: any; // The issues array and other analysis data
  success: boolean;
  error?: string;
}

export interface FixMyHomeHistoryEntry {
  _id: string;
  user: string;
  selectedIssues: string[];
  comments: string;
  noChangeComments: string;
  originalImage: string;
  transformedImage: string | null;
  analysisText: string;
  analysisJson: any;
  success: boolean;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryListResponse {
  success: boolean;
  entries: FixMyHomeHistoryEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface HistoryEntryResponse {
  success: boolean;
  entry: FixMyHomeHistoryEntry;
}

/**
 * Save a Fix My Home result to history
 */
export async function saveFixMyHomeResult(
  data: SaveFixMyHomeResultRequest
): Promise<{ success: boolean; historyId?: string; error?: string }> {
  try {
    console.log('[FixMyHomeHistoryService] Saving result...');

    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/save-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[FixMyHomeHistoryService] Save failed:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to save result',
      };
    }

    const result = await response.json();
    console.log('[FixMyHomeHistoryService] Result saved successfully:', result.historyId);

    return {
      success: true,
      historyId: result.historyId,
    };

  } catch (error) {
    console.error('[FixMyHomeHistoryService] Error saving result:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch Fix My Home history for the authenticated user
 */
export async function fetchFixMyHomeHistory(
  limit: number = 50,
  offset: number = 0,
  sort: 'asc' | 'desc' = 'desc'
): Promise<HistoryListResponse | { success: false; error: string }> {
  try {
    console.log('[FixMyHomeHistoryService] Fetching history...');

    const token = getAuthToken();

    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      sort,
    });

    const response = await fetch(`${API_BASE_URL}/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[FixMyHomeHistoryService] Fetch failed:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to fetch history',
      };
    }

    const result: HistoryListResponse = await response.json();
    console.log(`[FixMyHomeHistoryService] Fetched ${result.entries.length} entries`);

    return result;

  } catch (error) {
    console.error('[FixMyHomeHistoryService] Error fetching history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a specific Fix My Home history entry by ID
 */
export async function fetchFixMyHomeHistoryEntry(
  id: string
): Promise<HistoryEntryResponse | { success: false; error: string }> {
  try {
    console.log('[FixMyHomeHistoryService] Fetching history entry:', id);

    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[FixMyHomeHistoryService] Fetch entry failed:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to fetch history entry',
      };
    }

    const result: HistoryEntryResponse = await response.json();
    console.log('[FixMyHomeHistoryService] Entry fetched successfully');

    return result;

  } catch (error) {
    console.error('[FixMyHomeHistoryService] Error fetching entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a Fix My Home history entry
 */
export async function deleteFixMyHomeHistoryEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[FixMyHomeHistoryService] Deleting history entry:', id);

    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[FixMyHomeHistoryService] Delete failed:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to delete history entry',
      };
    }

    console.log('[FixMyHomeHistoryService] Entry deleted successfully');

    return { success: true };

  } catch (error) {
    console.error('[FixMyHomeHistoryService] Error deleting entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
