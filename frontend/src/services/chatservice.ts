// src/services/chatService.ts
import type { QuestionItem } from '../components/ToggleQuestionnaire';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  timestamp: string;
}

// ============================================================================
// QUESTIONNAIRE DATA
// ============================================================================

export const SYMPTOM_QUESTIONS: QuestionItem[] = [
  { id: 'q1', question: 'Does the patient misjudge steps, edges, or depth?', selected: false },
  { id: 'q2', question: 'Do patterned floors or shiny surfaces cause confusion?', selected: false },
  { id: 'q3', question: 'Do they struggle with glare or bright light?', selected: false },
  { id: 'q4', question: 'Do mirrors ever cause confusion or distress?', selected: false },
  { id: 'q5', question: 'Do they go to the wrong door when trying to leave a room?', selected: false },
  { id: 'q6', question: 'Do they go toward an exit instead of the bathroom when waking up at night?', selected: false },
  { id: 'q7', question: 'Have they slipped or nearly fallen in the bathroom recently?', selected: false },
  { id: 'q8', question: 'Do they have difficulty using stairs safely?', selected: false },
  { id: 'q9', question: 'Do they lose track of where items are stored unless they\'re visible?', selected: false },
  { id: 'q10', question: 'Do they struggle with clutter or too many objects on a surface?', selected: false },
];

export const ACTIVITY_TOPICS: QuestionItem[] = [
  { id: 'topic1', question: 'Food & cooking', selected: false },
  { id: 'topic2', question: 'Music & songs', selected: false },
  { id: 'topic3', question: 'Nature & outdoors', selected: false },
  { id: 'topic4', question: 'Travel & places', selected: false },
  { id: 'topic5', question: 'Sports & movement', selected: false },
  { id: 'topic6', question: 'Work & skills', selected: false },
  { id: 'topic7', question: 'Family & relationships', selected: false },
  { id: 'topic8', question: 'Celebrations & traditions', selected: false },
  { id: 'topic9', question: 'Spirituality / faith', selected: false },
  { id: 'topic10', question: 'Movies / TV / stories', selected: false },
  { id: 'topic11', question: 'Art / crafts / making things', selected: false },
  { id: 'topic12', question: 'Pets & animals', selected: false },
];

export const INITIAL_SYMPTOM_MESSAGE = "Good Evening, I am Mei Ling! Please help me fill in this quick questionnaire regarding your symptoms:";
export const ACTIVITY_SELECTION_MESSAGE = "Now, pick two topics that are most meaningful to them:";
export const MAX_ACTIVITY_SELECTIONS = 2;

// ============================================================================
// QUESTION/STATEMENT CONVERSION
// ============================================================================

// Function to convert questions to natural language statements
export function questionToStatement(question: string): string {
  const conversions: Record<string, string> = {
    'Does the patient misjudge steps, edges, or depth?': 'I misjudge steps, edges, or depth.',
    'Do patterned floors or shiny surfaces cause confusion?': 'Patterned floors or shiny surfaces cause me confusion.',
    'Do they struggle with glare or bright light?': 'I struggle with glare or bright light.',
    'Do mirrors ever cause confusion or distress?': 'Mirrors sometimes cause me confusion or distress.',
    'Do they go to the wrong door when trying to leave a room?': 'I sometimes go to the wrong door when trying to leave a room.',
    'Do they go toward an exit instead of the bathroom when waking up at night?': 'I sometimes go toward an exit instead of the bathroom when waking up at night.',
    'Have they slipped or nearly fallen in the bathroom recently?': 'I have slipped or nearly fallen in the bathroom recently.',
    'Do they have difficulty using stairs safely?': 'I have difficulty using stairs safely.',
    'Do they lose track of where items are stored unless they\'re visible?': 'I lose track of where items are stored unless they\'re visible.',
    'Do they struggle with clutter or too many objects on a surface?': 'I struggle with clutter or too many objects on a surface.',
  };

  return conversions[question] || question;
}

// Function to convert activities to natural language statements
export function activityToStatement(activity: string): string {
  const conversions: Record<string, string> = {
    'Food & cooking': 'Food & cooking',
    'Music & songs': 'Music & songs',
    'Nature & outdoors': 'Nature & outdoors',
    'Travel & places': 'Travel & places',
    'Sports & movement': 'Sports & movement',
    'Work & skills': 'Work & skills',
    'Family & relationships': 'Family & relationships',
    'Celebrations & traditions': 'Celebrations & traditions',
    'Spirituality / faith': 'Spirituality / faith',
    'Movies / TV / stories': 'Movies / TV / stories',
    'Art / crafts / making things': 'Art / crafts / making things',
    'Pets & animals': 'Pets & animals',
  };

  return conversions[activity] || activity;
}

// Function to generate probing questions based on selected activities
export function generateProbingQuestions(activities: string[]): Array<{
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: 'text';
}> {
  const questionMap: Record<string, string> = {
    'Food & cooking': 'What food or meal always makes them happy?',
    'Music & songs': 'What music, song, or sound brings them joy or calm?',
    'Nature & outdoors': 'Is there a place in nature they love or talk about often?',
    'Travel & places': 'What city, country, or place holds special memories for them?',
    'Sports & movement': 'Is there a sport or team they love, watch, or used to play?',
    'Work & skills': 'What kind of work or skill made them feel proud or confident?',
    'Family & relationships': 'Which people from their life do they talk about the most?',
    'Celebrations & traditions': 'Is there a holiday or tradition they especially look forward to?',
    'Spirituality / faith': 'Do they have a meaningful spiritual practice or place of worship?',
    'Movies / TV / stories': 'What movie, show, or story do they enjoy or rewatch?',
    'Art / crafts / making things': 'Do they enjoy making, drawing, or crafting anything in particular?',
    'Pets & animals': 'Have they ever had a favorite pet or animal they loved?',
  };

  return activities.map((activity, index) => ({
    id: (Date.now() + Math.random() + index).toString(),
    text: questionMap[activity] || `Tell me more about ${activity}`,
    isUser: false,
    timestamp: new Date(),
    type: 'text' as const
  }));
}

export const chatService = {
  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    // Replace with your actual API endpoint
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },
};