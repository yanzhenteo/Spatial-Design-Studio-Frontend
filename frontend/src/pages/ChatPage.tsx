// src/pages/ChatPage.tsx
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import ToggleQuestionnaire from '../components/ToggleQuestionnaire';
import type { QuestionItem } from '../components/ToggleQuestionnaire';

interface Message {
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

interface ChatPageProps {
  onBack?: () => void;
  onNext?: () => void;
}

// Function to convert questions to natural language statements
function questionToStatement(question: string): string {
  const conversions: Record<string, string> = {
    'Do you sometimes enter the wrong room?': 'I sometimes enter the wrong room.',
    'Do shiny floors or bright lights make it hard to see?': 'Shiny floors and bright lights make it hard for me to see.',
    'Is it hard to find bathroom at night?': 'It is hard for me to find the bathroom at night.',
    'Do mirrors/reflections sometimes confuse or startle you?': 'Mirrors and reflections sometimes confuse or startle me.',
    'Clear signs or colored doors would help?': 'Clear signs or colored doors would help me.',
    'Slipped or nearly slipped in the bathroom?': 'I have slipped or nearly slipped in the bathroom.',
    'Cluttered counters tops make finding things hard?': 'Cluttered counter tops make it hard for me to find things.',
    'Are stairs/step edges are hard to judge?': 'Stairs and step edges are hard for me to judge.',
  };

  return conversions[question] || question;
}

// Function to convert activities to natural language statements
function activityToStatement(activity: string): string {
  const conversions: Record<string, string> = {
    'Travel': 'Travel',
    'Nature': 'Nature',
    'Social Interaction': 'Social Interaction',
    'Food': 'Food',
    'Music': 'Music',
  };

  return conversions[activity] || activity;
}

// Function to generate probing questions based on selected activities
function generateProbingQuestions(activities: string[]): Message[] {
  const questionMap: Record<string, string> = {
    'Travel': 'What is your favorite destination you have visited?',
    'Nature': 'What is your favorite outdoor activity?',
    'Social Interaction': 'What is your favorite social activity?',
    'Food': 'What is your favorite food?',
    'Music': 'What is a song that will make you happy?',
  };

  return activities.map((activity, index) => ({
    id: (Date.now() + Math.random() + index).toString(),
    text: questionMap[activity] || `Tell me more about ${activity}`,
    isUser: false,
    timestamp: new Date(),
    type: 'text'
  }));
}

function ChatPage({ onBack, onNext }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Good Evening, I am Mei Ling! Please help me fill in this quick questionnaire regarding your symptoms:",
      isUser: false,
      timestamp: new Date(),
      type: 'questionnaire',
      questionnaire: {
        initialMessage: "Good Evening, I am Mei Ling! Please help me fill in this quick questionnaire regarding your symptoms:",
        questions: [
          { id: 'q1', question: 'Do you sometimes enter the wrong room?', selected: false },
          { id: 'q2', question: 'Do shiny floors or bright lights make it hard to see?', selected: false },
          { id: 'q3', question: 'Is it hard to find bathroom at night?', selected: false },
          { id: 'q4', question: 'Do mirrors/reflections sometimes confuse or startle you?', selected: false },
          { id: 'q5', question: 'Clear signs or colored doors would help?', selected: false },
          { id: 'q6', question: 'Slipped or nearly slipped in the bathroom?', selected: false },
          { id: 'q7', question: 'Cluttered counters tops make finding things hard?', selected: false },
          { id: 'q8', question: 'Are stairs/step edges are hard to judge?', selected: false },
        ]
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingProbingQuestions, setPendingProbingQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Check if there are pending probing questions
    if (pendingProbingQuestions.length > 0) {
      // Show the next probing question
      const nextQuestion = pendingProbingQuestions[0];
      const remainingQuestions = pendingProbingQuestions.slice(1);

      const probingMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        text: nextQuestion,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, probingMessage]);
      setPendingProbingQuestions(remainingQuestions);
      setIsLoading(false);
      return;
    }

    // TODO: Connect to backend here
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add bot response (mock for now)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I received your message: "${messageText}". This is where the AI response will go.`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    console.log('Microphone clicked, recording:', !isRecording);
    // TODO: Add speech-to-text logic here
  };

  return (
    <motion.div
      key="chat-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gradient-lightpurple-to-lightblue flex flex-col"
    >
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-muted-purple text-button-text flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <h1 className="text-header text-dark-grey">Memory Bot</h1>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="text-muted-purple text-button-text flex items-center gap-2"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          if (message.type === 'questionnaire' && message.questionnaire) {
            return (
              <ToggleQuestionnaire
                key={message.id}
                initialMessage={message.questionnaire.initialMessage}
                questions={message.questionnaire.questions}
                maxSelections={message.questionnaire.maxSelections}
                onComplete={(selectedQuestions) => {
                  // Determine which questionnaire this is based on content
                  const isFirstQuestionnaire = message.questionnaire?.initialMessage.includes('symptoms') || false;

                  // Convert questions to natural language statements
                  const naturalLanguageResponses = selectedQuestions
                    .map(q => {
                      if (isFirstQuestionnaire) {
                        return questionToStatement(q.question);
                      } else {
                        return activityToStatement(q.question);
                      }
                    })
                    .join(' and ');

                  const userResponse: Message = {
                    id: (Date.now() + Math.random()).toString(),
                    text: naturalLanguageResponses + '.',
                    isUser: true,
                    timestamp: new Date()
                  };

                  const updatedMessages = [...messages.slice(0, index + 1), userResponse];

                  // Only add the next questionnaire if this is the first one
                  if (isFirstQuestionnaire) {
                    const secondQuestionnaire: Message = {
                      id: (Date.now() + Math.random() + 1).toString(),
                      text: 'Now, pick two activities you enjoy the most:',
                      isUser: false,
                      timestamp: new Date(),
                      type: 'questionnaire',
                      questionnaire: {
                        initialMessage: 'Now, pick two activities you enjoy the most:',
                        maxSelections: 2,
                        questions: [
                          { id: 'activity1', question: 'Travel', selected: false },
                          { id: 'activity2', question: 'Nature', selected: false },
                          { id: 'activity3', question: 'Social Interaction', selected: false },
                          { id: 'activity4', question: 'Food', selected: false },
                          { id: 'activity5', question: 'Music', selected: false },
                        ]
                      }
                    };
                    updatedMessages.push(secondQuestionnaire);
                  } else {
                    // This is the second questionnaire - store all probing questions for sequential display
                    const selectedActivities = selectedQuestions.map(q => q.question);
                    if (selectedActivities.length > 0) {
                      const allProbingQuestions = generateProbingQuestions(selectedActivities);
                      const questionTexts = allProbingQuestions.map(q => q.text).filter((text): text is string => text !== undefined);

                      // Add the first question immediately
                      updatedMessages.push(allProbingQuestions[0]);

                      // Store remaining questions to show after user responds
                      setPendingProbingQuestions(questionTexts.slice(1));
                    }
                  }

                  setMessages(updatedMessages);
                  // TODO: Send to backend here
                }}
              />
            );
          }
          return (
            <ChatBubble
              key={message.id}
              message={message.text || ''}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-4 max-w-[70%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-dark-grey rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-dark-grey rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-dark-grey rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
    <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 items-center">
            {/* Microphone Button */}
            <button
            onClick={handleMicClick}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                isRecording 
                ? 'bg-red text-white animate-pulse' 
                : 'bg-light-purple text-muted-purple'
            }`}
            >
            <svg 
                className="w-5 h-5" 
                fill={isRecording ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
            </svg>
            </button>

            {/* Message Input - takes remaining space */}
            <div className="flex-1">
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
        </div>
    </div>
    </motion.div>
  );
}

export default ChatPage;