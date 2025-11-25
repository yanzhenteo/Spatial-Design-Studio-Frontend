// src/services/conversationIssueService.ts

import type { QuestionItem } from '../components/ToggleQuestionnaire';

// Mapping from backend question id (q1..q10) to FixMyHome issues.
const QUESTION_ID_TO_ISSUE: Record<string, string> = {
  q1: 'Depth misjudgment',
  q2: 'Pattern confusion',
  q3: 'Glare sensitivity',
  q4: 'Mirror confusion',
  q5: 'Door confusion',
  q6: 'Night misorientation',
  q7: 'Bathroom slips',
  q8: 'Stair difficulty',
  q9: 'Needs visibility',
  q10: 'Clutter sensitivity',
};

export interface ConversationRecord {
  _id: string;
  allMessages: Array<{
    id: string;
    text?: string;
    isUser: boolean;
    timestamp: string;
    type?: string;
    questionnaire?: {
      initialMessage: string;
      questions: QuestionItem[];
    };
  }>;
  // ...existing code...
}

/**
 * Returns a list of issue labels derived from the FIRST questionnaire
 * in the last saved conversation where questions have selected === true.
 */
export async function fetchIssuesFromLastConversation(): Promise<string[]> {
  try {
    const userAuth = localStorage.getItem('userAuth');
    if (!userAuth) {
      console.warn('[conversationIssueService] No userAuth token; cannot fetch conversations.');
      return [];
    }
    const { token } = JSON.parse(userAuth);

    console.log('[conversationIssueService] Fetching conversations from backend...');
    const res = await fetch('/api/conversations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error('[conversationIssueService] Failed to fetch conversations:', res.status);
      return [];
    }

    const data: ConversationRecord[] = await res.json();
    console.log('[conversationIssueService] Raw conversations payload:', data);

    if (!Array.isArray(data) || data.length === 0) {
      console.log('[conversationIssueService] No conversations found.');
      return [];
    }

    const lastConversation = data[0];
    console.log('[conversationIssueService] Using last conversation with _id:', lastConversation._id);

    const firstMessage = lastConversation.allMessages.find(
      m => m.id === '1' && m.type === 'questionnaire'
    );
    const questionnaire = firstMessage?.questionnaire;

    if (!questionnaire || !Array.isArray(questionnaire.questions)) {
      console.log('[conversationIssueService] No questionnaire found on first message.');
      return [];
    }

    console.log('[conversationIssueService] Questionnaire questions:', questionnaire.questions);

    const selectedQuestions = questionnaire.questions.filter(q => q.selected);
    console.log(
      '[conversationIssueService] Selected questions (id only):',
      selectedQuestions.map(q => q.id)
    );

    const issues = selectedQuestions
      .map(q => QUESTION_ID_TO_ISSUE[q.id])
      .filter((issue): issue is string => Boolean(issue));

    // NEW: explicit log right before returning
    console.log(
      '[conversationIssueService] FINAL issues list returned to FixMyHome:',
      issues.length > 0 ? issues : '(empty array)'
    );

    return issues;
  } catch (err) {
    console.error('[conversationIssueService] Error while fetching issues:', err);
    return [];
  }
}