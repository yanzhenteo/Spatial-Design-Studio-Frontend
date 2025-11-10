// src/services/chatService.ts
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  timestamp: string;
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