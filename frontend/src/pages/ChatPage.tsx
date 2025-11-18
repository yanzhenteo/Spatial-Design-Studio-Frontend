// src/pages/ChatPage.tsx
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import ToggleQuestionnaire from '../components/ToggleQuestionnaire';
import { generateAIQuestion } from '../utils/aiQuestionGenerator';
import type { ConversationContext } from '../utils/aiQuestionGenerator';
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
  const [hasActiveQuestionnaire, setHasActiveQuestionnaire] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'phase4'>('phase4');

  // Phase 4 state for topic-by-topic flow
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [topicConversations, setTopicConversations] = useState<Record<string, {
    fixedQuestion: string;
    fixedAnswer?: string;
    firstAIQuestion?: string;
    firstAIAnswer?: string;
    secondAIQuestion?: string;
    secondAIAnswer?: string;
  }>>({});
  const [phase4Complete, setPhase4Complete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveConversation = async () => {
    try {
      setIsSubmitting(true);

      // Prepare conversation data
      const conversationData = {
        selectedTopics,
        topicConversations,
        allMessages: messages,
        timestamp: new Date().toISOString()
      };

      // Call backend endpoint to save conversation
      const response = await fetch('/api/conversations/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversationData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.status}`);
      }

      console.log('Conversation saved successfully');

      // Navigate to PostMemoryBot after successful save
      onNext?.();
    } catch (error) {
      console.error('Error saving conversation:', error);
      // Show error message but still allow navigation
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Note: Could not save to backend, but you can continue.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      // Still navigate after a delay
      setTimeout(() => onNext?.(), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

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

    try {
      // Phase 4: Handle topic-by-topic conversation
      if (currentPhase === 'phase4' && !phase4Complete && selectedTopics.length > 0) {
        const currentTopic = selectedTopics[currentTopicIndex];
        const conversation = topicConversations[currentTopic];

        // Step 1: User answered the fixed question - show first AI-generated question
        if (!conversation.fixedAnswer) {
          setTopicConversations(prev => ({
            ...prev,
            [currentTopic]: { ...prev[currentTopic], fixedAnswer: messageText }
          }));

          // Generate first AI question
          const context: ConversationContext = {
            initialQuestion: conversation.fixedQuestion,
            initialAnswer: messageText
          };

          const firstAIQuestion = await generateAIQuestion(currentTopic, context, false);

          const aiQuestionMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            text: firstAIQuestion,
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          };

          setMessages(prev => [...prev, aiQuestionMessage]);
          setTopicConversations(prev => ({
            ...prev,
            [currentTopic]: { ...prev[currentTopic], firstAIQuestion }
          }));

          setIsLoading(false);
          return;
        }

        // Step 2: User answered first AI question - show second AI-generated question
        if (!conversation.firstAIAnswer) {
          setTopicConversations(prev => ({
            ...prev,
            [currentTopic]: { ...prev[currentTopic], firstAIAnswer: messageText }
          }));

          // Generate second AI question with full context
          const context: ConversationContext = {
            initialQuestion: conversation.fixedQuestion,
            initialAnswer: conversation.fixedAnswer,
            firstFollowUpQuestion: conversation.firstAIQuestion,
            firstFollowUpAnswer: messageText
          };

          const secondAIQuestion = await generateAIQuestion(currentTopic, context, true);

          const aiQuestionMessage: Message = {
            id: (Date.now() + Math.random()).toString(),
            text: secondAIQuestion,
            isUser: false,
            timestamp: new Date(),
            type: 'text'
          };

          setMessages(prev => [...prev, aiQuestionMessage]);
          setTopicConversations(prev => ({
            ...prev,
            [currentTopic]: { ...prev[currentTopic], secondAIQuestion }
          }));

          setIsLoading(false);
          return;
        }

        // Step 3: User answered second AI question - move to next topic or complete
        if (!conversation.secondAIAnswer) {
          setTopicConversations(prev => ({
            ...prev,
            [currentTopic]: { ...prev[currentTopic], secondAIAnswer: messageText }
          }));

          // Check if there are more topics
          if (currentTopicIndex + 1 < selectedTopics.length) {
            // Move to next topic
            const nextTopicIndex = currentTopicIndex + 1;
            const nextTopic = selectedTopics[nextTopicIndex];

            setCurrentTopicIndex(nextTopicIndex);

            // Initialize conversation for next topic
            setTopicConversations(prev => ({
              ...prev,
              [nextTopic]: {
                fixedQuestion: generateProbingQuestions([nextTopic])[0].text || ''
              }
            }));

            // Introduce next topic
            const introMessage: Message = {
              id: (Date.now() + Math.random()).toString(),
              text: `Let's talk about ${nextTopic}.`,
              isUser: false,
              timestamp: new Date(),
              type: 'text'
            };

            const nextFixedQuestion: Message = {
              id: (Date.now() + Math.random() + 1).toString(),
              text: generateProbingQuestions([nextTopic])[0].text || '',
              isUser: false,
              timestamp: new Date(),
              type: 'text'
            };

            setMessages(prev => [...prev, introMessage, nextFixedQuestion]);
          } else {
            // All topics complete - disable chat
            setPhase4Complete(true);
            const completionMessage: Message = {
              id: (Date.now() + Math.random()).toString(),
              text: 'Thank you for sharing these wonderful memories! We have all the information we need.',
              isUser: false,
              timestamp: new Date(),
              type: 'text'
            };
            setMessages(prev => [...prev, completionMessage]);
          }

          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in message handler:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
      {/* Fixed Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
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
          onClick={phase4Complete ? saveConversation : onNext}
          disabled={isSubmitting}
          className={`text-button-text flex items-center gap-2 transition-opacity ${
            phase4Complete
              ? 'bg-orange text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50'
              : 'text-muted-purple disabled:opacity-50'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Next'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto pt-16 pb-24 px-4">
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
                    // This is the second questionnaire - transition directly to Phase 4
                    const selectedActivities = selectedQuestions.map(q => q.question);
                    setSelectedTopics(selectedActivities);

                    // Set phase to 4 immediately after topic selection
                    setCurrentPhase('phase4');
                    setCurrentTopicIndex(0);

                    // Initialize conversation tracking for each topic
                    const initialConversations: Record<string, {
                      fixedQuestion: string;
                      fixedAnswer?: string;
                      firstAIQuestion?: string;
                      firstAIAnswer?: string;
                      secondAIQuestion?: string;
                      secondAIAnswer?: string;
                    }> = {};
                    selectedActivities.forEach(topic => {
                      initialConversations[topic] = {
                        fixedQuestion: generateProbingQuestions([topic])[0].text || ''
                      };
                    });
                    setTopicConversations(initialConversations);

                    if (selectedActivities.length > 0) {
                      // Start Phase 4: Introduce first topic and ask fixed question
                      const firstTopic = selectedActivities[0];
                      const introMessage: Message = {
                        id: (Date.now() + Math.random()).toString(),
                        text: `Let's talk about ${firstTopic}.`,
                        isUser: false,
                        timestamp: new Date(),
                        type: 'text'
                      };

                      const fixedQuestionMessage: Message = {
                        id: (Date.now() + Math.random() + 1).toString(),
                        text: generateProbingQuestions([firstTopic])[0].text || '',
                        isUser: false,
                        timestamp: new Date(),
                        type: 'text'
                      };

                      updatedMessages.push(introMessage, fixedQuestionMessage);

                      // Enable text input for Phase 4
                      setHasActiveQuestionnaire(false);
                    }
                  }

                  setMessages(updatedMessages);
                  // TODO: Send to backend here
                }}
              />
            );
          }

          // Check if this is the completion message and render with a button
          if (phase4Complete && message.text?.includes('Thank you for sharing')) {
            return (
              <div key={message.id} className="flex justify-start mb-4">
                <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-6 max-w-[70%] space-y-4">
                  <p className="text-big-text">{message.text}</p>
                  <p className="text-fill-text text-dark-grey opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onClick={saveConversation}
                    disabled={isSubmitting}
                    className="w-full bg-orange text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isSubmitting ? 'Saving...' : 'Next'}
                  </button>
                </div>
              </div>
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

      {/* Fixed Input Area */}
      <div className={`bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0 z-10 ${(hasActiveQuestionnaire || phase4Complete) ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex gap-3 items-center">
            {/* Microphone Button */}
            <button
            onClick={handleMicClick}
            disabled={hasActiveQuestionnaire || isLoading || phase4Complete}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                isRecording
                ? 'bg-red text-white animate-pulse'
                : 'bg-light-purple text-muted-purple'
            } ${(hasActiveQuestionnaire || isLoading || phase4Complete) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading || hasActiveQuestionnaire || phase4Complete} />
            </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ChatPage;