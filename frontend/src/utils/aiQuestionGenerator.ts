/**
 * Utility function to generate AI follow-up questions using OpenRouter API
 * Generates 2 warm, memory-focused follow-up questions for each topic
 */

const SYSTEM_PROMPT = `You are helping a caregiver uncover meaningful personal memories from an Alzheimer's patient to support reminiscence therapy and personalized home design.
The caregiver has already chosen a topic and provided a short response. Your job is to gently ask follow-up questions that help surface positive memories, sensory details, emotional associations, and specific moments that shaped their identity.

Important:

Ask one question at a time.

Questions must be simple, warm, and easy to answer.

Focus on memory anchors: people, places, routines, feelings, objects, sensory details.

Avoid medical or diagnostic language.

Do not ask about painful or traumatic memories.

Avoid leading or correcting the caregiver.

Your goal is not therapy — it is to uncover meaningful details that can be used to inspire home design, comfort, and identity support.

Example approach (not to be shown to user): If they mention "I loved my grandmother's cooking," follow up with questions like:

"What did the kitchen smell like when she cooked?"

"Was there a dish she made just for you?"

"Do you remember what the plates or table looked like?"`;

interface GeneratedQuestions {
  topic: string;
  questions: string[];
}

export async function generateAIQuestions(
  topic: string,
  userResponse: string
): Promise<GeneratedQuestions> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not found in environment variables');
  }

  const userMessage = `Topic: ${topic}
User's response: "${userResponse}"

Please generate exactly 2 warm, simple follow-up questions that help uncover meaningful memories related to this response. Format your response as a JSON array with exactly 2 question strings, nothing else. Example format:
["Question 1?", "Question 2?"]`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    // Parse the JSON array response
    const questions = JSON.parse(content);

    if (!Array.isArray(questions) || questions.length !== 2) {
      throw new Error('AI response did not return exactly 2 questions');
    }

    return {
      topic,
      questions
    };
  } catch (error) {
    console.error('Error generating AI questions:', error);
    throw error;
  }
}

/**
 * Generate questions for all selected topics
 * Returns an array of questions ready to be displayed sequentially
 */
export async function generateQuestionsForTopics(
  topics: string[],
  userResponses: Record<string, string>
): Promise<string[]> {
  const allQuestions: string[] = [];

  try {
    for (const topic of topics) {
      const userResponse = userResponses[topic] || '';
      const result = await generateAIQuestions(topic, userResponse);
      allQuestions.push(...result.questions);
    }
    return allQuestions;
  } catch (error) {
    console.error('Error generating questions for topics:', error);
    throw error;
  }
}
