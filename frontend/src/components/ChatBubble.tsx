// src/components/ChatBubble.tsx
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

function ChatBubble({ message, isUser, timestamp = new Date() }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-2xl p-4 ${
          isUser 
            ? 'bg-white text-dark-grey rounded-br-none' 
            : 'bg-light-yellow text-dark-grey rounded-bl-none'
        }`}
      >
        <p className="text-big-text">{message}</p>
        <p className="text-fill-text text-dark-grey opacity-70 mt-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export default ChatBubble;