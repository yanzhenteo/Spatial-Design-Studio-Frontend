// src/types/chat.types.ts
import type { QuestionItem } from '../components/ToggleQuestionnaire';

export interface Message {
  id: string;
  text?: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'questionnaire';
  questionnaire?: {
    initialMessage: string;
    questions: QuestionItem[];
    maxSelections?: number;
  };
}

export interface TopicConversation {
  fixedQuestion: string;
  fixedAnswer?: string;
  firstAIQuestion?: string;
  firstAIAnswer?: string;
  secondAIQuestion?: string;
  secondAIAnswer?: string;
}

export interface ConversationState {
  selectedTopics: string[];
  topicConversations: Record<string, TopicConversation>;
  currentTopicIndex: number;
  phase4Complete: boolean;
}
