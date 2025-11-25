// src/pages/ChatPage.tsx
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import ToggleQuestionnaire from '../components/ToggleQuestionnaire';
import {
  SYMPTOM_QUESTIONS,
  INITIAL_SYMPTOM_MESSAGE,
  handleQuestionnaireCompletion
} from '../services/chatservice';
import {
  useAudioPlayer,
  useVoiceRecording
} from '../services/verboseServices';
import {
  saveConversation as saveConversationAPI,
  prepareConversationData,
  handleTopicConversationStep,
  handleTopicTransition,
  useConversationFlow
} from '../services/conversationService';
import type { Message } from '../types/chat.types';

interface ChatPageProps {
  onBack?: () => void;
  onNext?: () => void;
}

function ChatPage({ onBack, onNext }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: INITIAL_SYMPTOM_MESSAGE,
      isUser: false,
      timestamp: new Date(),
      type: 'questionnaire',
      questionnaire: {
        initialMessage: INITIAL_SYMPTOM_MESSAGE,
        questions: SYMPTOM_QUESTIONS
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveQuestionnaire, setHasActiveQuestionnaire] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase1Complete, setPhase1Complete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for state management
  const { speak: textToSpeech } = useAudioPlayer();
  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecordingAndTranscribe
  } = useVoiceRecording();
  const {
    selectedTopics,
    currentTopicIndex,
    topicConversations,
    phase4Complete,
    currentPhase,
    initializeTopicConversations,
    updateTopicConversations,
    setCurrentTopicIndex,
    setPhase4Complete
  } = useConversationFlow();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play the initial message when component mounts
  useEffect(() => {
    // Play the first message after a short delay to ensure everything is loaded
    const timer = setTimeout(() => {
      textToSpeech(INITIAL_SYMPTOM_MESSAGE);
    }, 1000);

    return () => clearTimeout(timer);
  }, [textToSpeech]); // textToSpeech is stable from the hook

  // Detect completion message and ensure phase4Complete is set
  useEffect(() => {
    const hasCompletionMessage = messages.some(msg => msg.text?.includes('Thank you for sharing'));
    if (hasCompletionMessage && !phase4Complete) {
      setPhase4Complete(true);
    }
  }, [messages, phase4Complete, setPhase4Complete]);

  const saveConversation = async () => {
    try {
      setIsSubmitting(true);

      // DEBUG: log what we're about to save
      const firstQuestionnaire = messages[0]?.questionnaire;
      if (firstQuestionnaire) {
        console.log('[ChatPage] Saving questionnaire questions:', firstQuestionnaire.questions);
      } else {
        console.log('[ChatPage] No questionnaire found on first message.');
      }

      // Prepare conversation data using the service
      const conversationData = prepareConversationData(
        selectedTopics,
        topicConversations,
        messages
      );

      // Save using the service
      const result = await saveConversationAPI(conversationData);

      if (result.success) {
        // Navigate to PostMemoryBot after successful save
        onNext?.();
      } else {
        throw new Error(result.error || 'Failed to save conversation');
      }
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

        // Handle conversation step (generates questions if needed)
        const stepResult = await handleTopicConversationStep(
          messageText,
          currentTopic,
          conversation,
          topicConversations
        );

        // Update state with new conversation data
        if (stepResult.updatedTopicConversations) {
          updateTopicConversations(stepResult.updatedTopicConversations);
        }

        // Add AI messages to chat
        setMessages(prev => [...prev, ...stepResult.messages]);

        // Play AI messages via text-to-speech
        stepResult.messages.forEach(msg => {
          if (msg.text) {
            textToSpeech(msg.text);
          }
        });

        // Check if conversation step is complete (no more questions to ask)
        const updatedConversation = stepResult.updatedTopicConversations?.[currentTopic];
        if (updatedConversation?.secondAIAnswer) {
          // Handle transition to next topic or completion
          const transitionResult = handleTopicTransition(
            currentTopicIndex,
            selectedTopics,
            stepResult.updatedTopicConversations!
          );

          // Update state based on transition
          if (transitionResult.updatedTopicConversations) {
            updateTopicConversations(transitionResult.updatedTopicConversations);
          }

          if (transitionResult.nextTopicIndex !== undefined) {
            setCurrentTopicIndex(transitionResult.nextTopicIndex);
          }

          // Set phase4Complete BEFORE adding messages to ensure render picks it up
          if (transitionResult.phase4Complete) {
            setPhase4Complete(true);
          }

          // Add transition messages
          setMessages(prev => [...prev, ...transitionResult.messages]);

          // Play transition messages
          transitionResult.messages.forEach((msg, index) => {
            if (msg.text) {
              if (index === 0) {
                textToSpeech(msg.text);
              } else {
                // Delay second message slightly
                setTimeout(() => textToSpeech(msg.text!), 2000);
              }
            }
          });
        }

        setIsLoading(false);
        return;
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

  const handleMicClick = async () => {
    if (isRecording) {
      try {
        console.log('Microphone clicked, stopping recording');
        const transcript = await stopRecordingAndTranscribe();
        await handleSendMessage(transcript);
      } catch (error) {
        console.error('Error stopping recording: ', error);
        alert('Failed to transcribe audio, Please try again.')
      }
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Unable to access microphone. Please check permissions.');
      }
    }
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

        {/* Next Button - Only visible during Phase 1 or after Phase 4 */}
        {(phase1Complete && !phase4Complete) && (
          <button
            onClick={saveConversation}
            disabled={isSubmitting}
            className="text-button-text flex items-center gap-2 transition-opacity text-muted-purple disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Next'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {/* Invisible placeholder to maintain layout when button is hidden */}
        {(!phase1Complete || phase4Complete) && (
          <div className="w-12 h-4" />
        )}
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
                  // --- NEW: persist selected state into messages[index].questionnaire.questions ---
                  setMessages(prev => {
                    const next = [...prev];

                    const current = next[index];
                    if (current.type === 'questionnaire' && current.questionnaire) {
                      // Build full questions array with correct selected flags
                      const fullQuestions = current.questionnaire.questions.map(q => ({
                        ...q,
                        selected: selectedQuestions.some(sq => sq.id === q.id),
                      }));

                      current.questionnaire = {
                        ...current.questionnaire,
                        questions: fullQuestions,
                      };
                    }

                    return next;
                  });
                  // --- END NEW ---

                  // Determine which questionnaire this is based on content
                  const isFirstQuestionnaire =
                    message.questionnaire?.initialMessage.includes('symptoms') || false;

                  // Use utility function to handle questionnaire completion
                  const result = handleQuestionnaireCompletion(
                    selectedQuestions,
                    isFirstQuestionnaire,
                    textToSpeech
                  );

                  // Build updated messages array (append response and next questionnaire)
                  const updatedMessages = [
                    ...messages.slice(0, index + 1),
                    result.userResponseMessage,
                  ];

                  if (result.nextQuestionnaire) {
                    updatedMessages.push(result.nextQuestionnaire);
                  }

                  if (result.shouldTransitionToPhase4 && result.selectedActivities) {
                    initializeTopicConversations(result.selectedActivities);

                    if (result.phase4Messages) {
                      updatedMessages.push(...result.phase4Messages);
                    }

                    setHasActiveQuestionnaire(false);
                  } else if (isFirstQuestionnaire) {
                    setPhase1Complete(true);
                  }

                  setMessages(updatedMessages);
                }}
              />
            );
          }

          // Check if this is the completion message and add button inside
          const isCompletionMessage = message.text?.includes('Thank you for sharing');
          if (isCompletionMessage) {
            return (
              <div key={message.id} className="flex justify-start mb-4">
                <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-6 max-w-[70%] space-y-4">
                  <p className="text-big-text">{message.text}</p>
                  <p className="text-fill-text text-dark-grey opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={saveConversation}
                      disabled={isSubmitting}
                      className="w-full bg-orange-400 text-white text-button-text font-semibold py-3 px-6 rounded-full hover:bg-orange-500 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Regular message rendering
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
            disabled={hasActiveQuestionnaire || isLoading || phase4Complete || isTranscribing}
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