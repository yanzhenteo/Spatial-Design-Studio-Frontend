// src/pages/ChatPage.tsx
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import ToggleQuestionnaire from '../components/ToggleQuestionnaire';
import { generateQuestionsForTopics } from '../utils/aiQuestionGenerator';
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
function activityToStatement(activity: string): string {
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
function generateProbingQuestions(activities: string[]): Message[] {
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
        ]
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingProbingQuestions, setPendingProbingQuestions] = useState<string[]>([]);
  const [pendingAIQuestions, setPendingAIQuestions] = useState<string[]>([]);
  const [hasActiveQuestionnaire, setHasActiveQuestionnaire] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicResponses] = useState<Record<string, string>>({});
  const [currentPhase, setCurrentPhase] = useState<'phase3' | 'phase4'>('phase3');
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

    // Check if there are pending AI-generated questions (Phase 4)
    if (pendingAIQuestions.length > 0) {
      // Show the next AI-generated question
      const nextQuestion = pendingAIQuestions[0];
      const remainingQuestions = pendingAIQuestions.slice(1);

      const aiQuestionMessage: Message = {
        id: (Date.now() + Math.random()).toString(),
        text: nextQuestion,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiQuestionMessage]);
      setPendingAIQuestions(remainingQuestions);
      setIsLoading(false);
      return;
    }

    // Check if there are pending probing questions (Phase 3)
    if (pendingProbingQuestions.length > 0) {
      // Store the user's response to the probing question
      // For now we're simplifying - just showing next question
      // In a full implementation, you'd map this back to the topic

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

      // If this was the last probing question, move to phase 4
      if (remainingQuestions.length === 0) {
        setCurrentPhase('phase4');
      }

      setIsLoading(false);
      return;
    }

    // Phase 4: Generate AI follow-up questions after phase 3 is complete
    if (currentPhase === 'phase4' && selectedTopics.length > 0 && pendingAIQuestions.length === 0) {
      try {
        const allAIQuestions = await generateQuestionsForTopics(selectedTopics, topicResponses);

        if (allAIQuestions.length > 0) {
          // Add the first question immediately
          const firstQuestion = allAIQuestions[0];
          const remainingQuestions = allAIQuestions.slice(1);

          const aiQuestionMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            text: firstQuestion,
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          };

          setMessages(prev => [...prev, aiQuestionMessage]);
          setPendingAIQuestions(remainingQuestions);
        }
      } catch (error) {
        console.error('Error generating AI questions:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I'm having trouble generating follow-up questions right now. Please try again.",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(false);
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
                      text: 'Now, pick two topics that are most meaningful to them:',
                      isUser: false,
                      timestamp: new Date(),
                      type: 'questionnaire',
                      questionnaire: {
                        initialMessage: 'Now, pick two topics that are most meaningful to them:',
                        maxSelections: 2,
                        questions: [
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
                        ]
                      }
                    };
                    updatedMessages.push(secondQuestionnaire);
                  } else {
                    // This is the second questionnaire - store all probing questions for sequential display
                    const selectedActivities = selectedQuestions.map(q => q.question);
                    setSelectedTopics(selectedActivities);

                    if (selectedActivities.length > 0) {
                      const allProbingQuestions = generateProbingQuestions(selectedActivities);
                      const questionTexts = allProbingQuestions.map(q => q.text).filter((text): text is string => text !== undefined);

                      // Add the first question immediately
                      updatedMessages.push(allProbingQuestions[0]);

                      // Store remaining questions to show after user responds
                      setPendingProbingQuestions(questionTexts.slice(1));

                      // No more questionnaires - enable text input
                      setHasActiveQuestionnaire(false);
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
    <div className={`bg-white border-t border-gray-200 p-4 ${hasActiveQuestionnaire ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex gap-3 items-center">
            {/* Microphone Button */}
            <button
            onClick={handleMicClick}
            disabled={hasActiveQuestionnaire || isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                isRecording
                ? 'bg-red text-white animate-pulse'
                : 'bg-light-purple text-muted-purple'
            } ${(hasActiveQuestionnaire || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading || hasActiveQuestionnaire} />
            </div>
        </div>
    </div>
    </motion.div>
  );
}

export default ChatPage;