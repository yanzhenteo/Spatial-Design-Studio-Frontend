// src/services/conversationService.ts
import { useState, useCallback } from 'react';
import { generateAIQuestion } from '../utils/aiQuestionGenerator';
import type { ConversationContext } from '../utils/aiQuestionGenerator';
import { generateProbingQuestions } from './chatservice';
import type { Message, TopicConversation } from '../types/chat.types';
import { fetchWithRetry } from './networkUtils'; // NEW

export interface ConversationData {
  selectedTopics: string[];
  topicConversations: Record<string, TopicConversation>;
  allMessages: Message[];
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

    const response = await fetchWithRetry(
      '/api/conversations/save',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(conversationData)
      },
      {
        retries: 2,       // total 3 attempts
        retryDelayMs: 800,
        timeoutMs: 8000,  // 8s per attempt
      }
    );

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
  messages: Message[]
): ConversationData {
  return {
    selectedTopics,
    topicConversations,
    allMessages: messages,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// CONVERSATION FLOW HANDLING
// ============================================================================

export interface ConversationFlowResult {
  messages: Message[];
  updatedTopicConversations?: Record<string, TopicConversation>;
  nextTopicIndex?: number;
  phase4Complete?: boolean;
}

/**
 * Handles Phase 4 conversation flow - processes user response for current topic
 * @param messageText - The user's message text
 * @param currentTopic - The current topic being discussed
 * @param conversation - The current topic's conversation state
 * @param topicConversations - All topic conversations
 * @returns Result containing new messages and updated state
 */
export async function handleTopicConversationStep(
  messageText: string,
  currentTopic: string,
  conversation: TopicConversation,
  topicConversations: Record<string, TopicConversation>
): Promise<ConversationFlowResult> {
  const result: ConversationFlowResult = {
    messages: [],
    updatedTopicConversations: { ...topicConversations }
  };

  // Step 1: User answered the fixed question - generate first AI question
  if (!conversation.fixedAnswer) {
    result.updatedTopicConversations![currentTopic] = {
      ...conversation,
      fixedAnswer: messageText
    };

    const context: ConversationContext = {
      initialQuestion: conversation.fixedQuestion,
      initialAnswer: messageText
    };

    const firstAIQuestion = await generateAIQuestion(currentTopic, context, false);

    result.messages.push({
      id: (Date.now() + Math.random()).toString(),
      text: firstAIQuestion,
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    });

    result.updatedTopicConversations![currentTopic].firstAIQuestion = firstAIQuestion;
    return result;
  }

  // Step 2: User answered first AI question - generate second AI question
  if (!conversation.firstAIAnswer) {
    result.updatedTopicConversations![currentTopic] = {
      ...conversation,
      firstAIAnswer: messageText
    };

    const context: ConversationContext = {
      initialQuestion: conversation.fixedQuestion,
      initialAnswer: conversation.fixedAnswer,
      firstFollowUpQuestion: conversation.firstAIQuestion,
      firstFollowUpAnswer: messageText
    };

    const secondAIQuestion = await generateAIQuestion(currentTopic, context, true);

    result.messages.push({
      id: (Date.now() + Math.random()).toString(),
      text: secondAIQuestion,
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    });

    result.updatedTopicConversations![currentTopic].secondAIQuestion = secondAIQuestion;
    return result;
  }

  // Step 3: User answered second AI question - mark as complete
  result.updatedTopicConversations![currentTopic] = {
    ...conversation,
    secondAIAnswer: messageText
  };

  return result;
}

/**
 * Handles transition to the next topic or completion
 * @param currentTopicIndex - The current topic index
 * @param selectedTopics - Array of all selected topics
 * @param topicConversations - Current topic conversations state
 * @returns Result containing messages for next topic or completion
 */
export function handleTopicTransition(
  currentTopicIndex: number,
  selectedTopics: string[],
  topicConversations: Record<string, TopicConversation>
): ConversationFlowResult {
  const result: ConversationFlowResult = {
    messages: [],
    updatedTopicConversations: { ...topicConversations }
  };

  // Check if there are more topics
  if (currentTopicIndex + 1 < selectedTopics.length) {
    // Move to next topic
    const nextTopicIndex = currentTopicIndex + 1;
    const nextTopic = selectedTopics[nextTopicIndex];

    result.nextTopicIndex = nextTopicIndex;

    // Initialize conversation for next topic
    result.updatedTopicConversations![nextTopic] = {
      fixedQuestion: generateProbingQuestions([nextTopic])[0].text || ''
    };

    // Create intro and question messages
    result.messages.push(
      {
        id: (Date.now() + Math.random()).toString(),
        text: `Let's talk about ${nextTopic}.`,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      },
      {
        id: (Date.now() + Math.random() + 1).toString(),
        text: generateProbingQuestions([nextTopic])[0].text || '',
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      }
    );
  } else {
    // All topics complete
    result.phase4Complete = true;
    result.messages.push({
      id: (Date.now() + Math.random()).toString(),
      text: 'Thank you for sharing these wonderful memories! We have all the information we need.',
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    });
  }

  return result;
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for managing conversation flow state
 */
export function useConversationFlow() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [topicConversations, setTopicConversations] = useState<Record<string, TopicConversation>>({});
  const [phase4Complete, setPhase4Complete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'phase4'>('phase4');

  const initializeTopicConversations = useCallback((topics: string[]) => {
    const initialConversations: Record<string, TopicConversation> = {};
    topics.forEach(topic => {
      initialConversations[topic] = {
        fixedQuestion: generateProbingQuestions([topic])[0].text || ''
      };
    });
    setTopicConversations(initialConversations);
    setSelectedTopics(topics);
    setCurrentTopicIndex(0);
    setCurrentPhase('phase4');
  }, []);

  const updateTopicConversations = useCallback((updated: Record<string, TopicConversation>) => {
    setTopicConversations(updated);
  }, []);

  const moveToNextTopic = useCallback(() => {
    setCurrentTopicIndex(prev => prev + 1);
  }, []);

  const completePhase4 = useCallback(() => {
    setPhase4Complete(true);
  }, []);

  const resetConversationFlow = useCallback(() => {
    setSelectedTopics([]);
    setCurrentTopicIndex(0);
    setTopicConversations({});
    setPhase4Complete(false);
    setCurrentPhase('phase4');
  }, []);

  return {
    // State
    selectedTopics,
    currentTopicIndex,
    topicConversations,
    phase4Complete,
    currentPhase,
    // Actions
    initializeTopicConversations,
    updateTopicConversations,
    moveToNextTopic,
    completePhase4,
    resetConversationFlow,
    // Setters (for direct updates if needed)
    setCurrentTopicIndex,
    setPhase4Complete
  };
}
