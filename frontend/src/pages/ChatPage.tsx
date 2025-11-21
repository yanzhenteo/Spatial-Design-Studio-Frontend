// src/pages/ChatPage.tsx
import { motion } from 'framer-motion';
import { useState, useRef, useEffect ,useCallback} from 'react';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import ToggleQuestionnaire from '../components/ToggleQuestionnaire';
import { generateAIQuestion } from '../utils/aiQuestionGenerator';
import type { ConversationContext } from '../utils/aiQuestionGenerator';
import type { QuestionItem } from '../components/ToggleQuestionnaire';
import {
  questionToStatement,
  activityToStatement,
  generateProbingQuestions,
  SYMPTOM_QUESTIONS,
  ACTIVITY_TOPICS,
  INITIAL_SYMPTOM_MESSAGE,
  ACTIVITY_SELECTION_MESSAGE,
  MAX_ACTIVITY_SELECTIONS
} from '../services/chatservice';
import {
  transcribeAudio,
  startRecording as startAudioRecording,
  stopRecording as stopAudioRecording,
  textToSpeechComplete
} from '../services/verboseServices';
import {
  saveConversation as saveConversationAPI,
  prepareConversationData
} from '../services/conversationService';


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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
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
  const [, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
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
  }, []); // Empty dependency array = run once on mount

  const saveConversation = async () => {
    try {
      setIsSubmitting(true);

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

          // TEXT-TO-SPEECH: Play the AI question
          textToSpeech(firstAIQuestion);
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

          // TEXT-TO-SPEECH: Play the AI question
          textToSpeech(secondAIQuestion);
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

            // TEXT-TO-SPEECH: Play both messages
            textToSpeech(introMessage.text || '');
            // Wait a bit before playing the second message
            setTimeout(() => textToSpeech(nextFixedQuestion.text || ''), 2000);
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

            // TEXT-TO-SPEECH: Play completion message
            textToSpeech(completionMessage.text || '');
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

  // TEXT-TO-SPEECH: Process queue and play audio sequentially
  const processAudioQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;
    console.log('🎵 Starting audio queue processing');
    console.log('Queue length:', audioQueueRef.current.length);

    while (audioQueueRef.current.length > 0) {
      const text = audioQueueRef.current.shift();
      if (!text) continue;

      console.log('\n=== PROCESSING QUEUE ITEM ===');
      console.log('Remaining in queue:', audioQueueRef.current.length);
      console.log('Text to convert:', text);

      try {
        setIsSpeaking(true);

        // Stop previous audio if any
        if (audioRef.current) {
          console.log('Stopping previous audio');
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }

        // Use the service function
        const audio = await textToSpeechComplete(text);
        audioRef.current = audio;

        setIsSpeaking(false);
      } catch (err) {
        console.error('Error processing queue item:', err);
        setIsSpeaking(false);
      }
    }

    isProcessingQueueRef.current = false;
    console.log('✅ Queue processing complete\n');
  }, []); // All dependencies are refs or functions that don't change

  // TEXT-TO-SPEECH: Add text to queue and start processing
  const textToSpeech = useCallback((text: string) => {
    console.log('➕ Adding to TTS queue:', text);
    audioQueueRef.current.push(text);
    console.log('Queue length now:', audioQueueRef.current.length);
    processAudioQueue();
  }, [processAudioQueue]);

  // SPEECH-TO-TEXT: Start recording
  const startRecording = useCallback(async () => {
    try {
      const { mediaRecorder, chunks } = await startAudioRecording();
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = chunks;
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  // SPEECH-TO-TEXT: Stop recording and transcribe
  const stopRecording = useCallback(async (): Promise<string> => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      throw new Error('No active recording');
    }

    try {
      setIsRecording(false);
      setIsTranscribing(true);

      // Use the service function to stop recording
      const audioFile = await stopAudioRecording(mediaRecorder, chunksRef.current);

      console.log('Recording stopped, transcribing...');

      // Use the service function to transcribe
      const result = await transcribeAudio(audioFile);
      setIsTranscribing(false);

      if (result.success && result.transcript) {
        console.log('Transcription successful:', result.transcript);
        return result.transcript;
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      setIsTranscribing(false);
      throw error;
    }
  }, []);

  const handleMicClick = async () => {
    if (isRecording) {
      try {
        console.log('Microphone clicked, recording:', !isRecording);
        const transcript = await stopRecording();
        await handleSendMessage(transcript);
      } catch (error) {
        console.error('Error stopping recording: ', error);
        alert('Failed to transcribe audio, Please try again.')
      }
    // TODO: Add speech-to-text logic here
  } else {
    await startRecording();
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
                      text: ACTIVITY_SELECTION_MESSAGE,
                      isUser: false,
                      timestamp: new Date(),
                      type: 'questionnaire',
                      questionnaire: {
                        initialMessage: ACTIVITY_SELECTION_MESSAGE,
                        maxSelections: MAX_ACTIVITY_SELECTIONS,
                        questions: ACTIVITY_TOPICS
                      }
                    };
                    updatedMessages.push(secondQuestionnaire);

                    // TEXT-TO-SPEECH: Play second questionnaire message
                    setTimeout(() => textToSpeech(ACTIVITY_SELECTION_MESSAGE), 500);
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

                      // TEXT-TO-SPEECH: Play both initial messages
                      setTimeout(() => {
                        textToSpeech(introMessage.text || '');
                        setTimeout(() => textToSpeech(fixedQuestionMessage.text || ''), 2000);
                      }, 500);
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