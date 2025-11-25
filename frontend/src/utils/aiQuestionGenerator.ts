/**
 * Utility function to generate AI follow-up questions using OpenRouter API
 * Generates contextual follow-up questions based on previous answers
 */

const SYSTEM_PROMPT = `You are helping a caregiver uncover meaningful personal memories from an Alzheimer's patient to support reminiscence therapy and personalized home design.
The caregiver has chosen a topic and provided responses to questions. Your job is to gently ask a follow-up question that helps surface positive memories, sensory details, emotional associations, and specific moments that shaped their identity.

Important:

Ask ONE question only.

Questions must be simple, warm, and easy to answer.

Focus on memory anchors: people, places, routines, feelings, objects, sensory details.

Avoid medical or diagnostic language.

Do not ask about painful or traumatic memories.

Avoid leading or correcting the caregiver.

Your goal is not therapy — it is to uncover meaningful details that can be used to inspire home design, comfort, and identity support.

If this is a follow-up to previous answers, build naturally on what they've shared. Help them expand on the memories and details they've already mentioned.

Example approach (not to be shown to user): If they mention "I loved my grandmother's cooking," follow up with questions like:

"What did the kitchen smell like when she cooked?"

"Was there a dish she made just for you?"

"Do you remember what the plates or table looked like?"`;

export interface ConversationContext {
  initialQuestion: string;
  initialAnswer: string;
  firstFollowUpQuestion?: string;
  firstFollowUpAnswer?: string;
}

import { fetchWithRetry } from '../services/networkUtils';

export async function generateAIQuestion(
  topic: string,
  context: ConversationContext,
  isSecondFollowUp: boolean = false
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not found in environment variables');
  }

  let userMessage = '';

  if (isSecondFollowUp) {
    // Second follow-up has more context
    userMessage = `Topic: ${topic}

Conversation so far:
Q: "${context.initialQuestion}"
A: "${context.initialAnswer}"

Q: "${context.firstFollowUpQuestion}"
A: "${context.firstFollowUpAnswer}"

Please generate one warm, simple follow-up question that naturally builds on both their previous answers and helps uncover more meaningful memories. Return ONLY the question text, nothing else.`;
  } else {
    // First follow-up based on initial answer
    userMessage = `Topic: ${topic}

Q: "${context.initialQuestion}"
A: "${context.initialAnswer}"

Please generate one warm, simple follow-up question based on their response. Return ONLY the question text, nothing else.`;
  }

  try {
    const response = await fetchWithRetry(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Memory Bot',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4.1-nano',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      },
      {
        retries: 2,
        retryDelayMs: 800,
        timeoutMs: 15000, // OpenRouter can be a bit slower
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const question = data.choices[0].message.content.trim();

    return question;
  } catch (error) {
    console.error('Error generating AI question:', error);
    throw error;
  }
}
