// src/services/conversationService.ts

export interface ConversationData {
  selectedTopics: string[];
  topicConversations: Record<string, {
    fixedQuestion: string;
    fixedAnswer?: string;
    firstAIQuestion?: string;
    firstAIAnswer?: string;
    secondAIQuestion?: string;
    secondAIAnswer?: string;
  }>;
  allMessages: any[]; // Use the Message type from ChatPage
  timestamp: string;
}

export interface SaveConversationResult {
  success: boolean;
  error?: string;
}

/**
 * Gets the authentication token from localStorage
 * @returns The auth token or throws an error if not found
 */
function getAuthToken(): string {
  const userAuth = localStorage.getItem('userAuth');
  if (!userAuth) {
    throw new Error('User not authenticated. Cannot save conversation.');
  }
  const { token } = JSON.parse(userAuth);
  return token;
}

/**
 * Saves conversation data to the backend API
 * @param conversationData - The conversation data to save
 * @returns Result indicating success or failure
 */
export async function saveConversation(
  conversationData: ConversationData
): Promise<SaveConversationResult> {
  try {
    const token = getAuthToken();

    const response = await fetch('/api/conversations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(conversationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to save conversation: ${response.status}`);
    }

    console.log('Conversation saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Prepares conversation data for saving
 * @param selectedTopics - Array of selected topic strings
 * @param topicConversations - Record of topic conversation details
 * @param messages - Array of all messages
 * @returns Formatted conversation data ready for API submission
 */
export function prepareConversationData(
  selectedTopics: string[],
  topicConversations: ConversationData['topicConversations'],
  messages: any[]
): ConversationData {
  return {
    selectedTopics,
    topicConversations,
    allMessages: messages,
    timestamp: new Date().toISOString()
  };
}
