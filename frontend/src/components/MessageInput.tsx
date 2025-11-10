// src/components/MessageInput.tsx 
import { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-muted-purple focus:border-transparent text-fill-text"
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="bg-muted-purple text-white w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  );
}

export default MessageInput;