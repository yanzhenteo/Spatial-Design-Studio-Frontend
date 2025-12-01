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

interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
  speaker: 'granted' | 'denied' | 'prompt' | 'unavailable';
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
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: 'prompt',
    speaker: 'prompt'
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionModalType, setPermissionModalType] = useState<'microphone' | 'speaker' | 'both' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Check and request permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      const micPermission = await checkMicrophonePermission();
      const speakerPermission = await checkSpeakerPermission();
      
      setPermissions({
        microphone: micPermission,
        speaker: speakerPermission
      });

      // If microphone is not granted, show permission modal
      if (micPermission !== 'granted') {
        setTimeout(() => {
          setPermissionModalType(micPermission === 'denied' ? 'microphone' : 'both');
          setShowPermissionModal(true);
        }, 1000);
      }
    };

    checkPermissions();
  }, []);

  const checkMicrophonePermission = async (): Promise<PermissionStatus['microphone']> => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia not supported on this browser');
        return 'unavailable';
      }

      // Check permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'granted') {
          return 'granted';
        } else if (permission.state === 'denied') {
          return 'denied';
        }
      }

      // Try to get microphone access to test
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'unavailable';
      }
      return 'prompt';
    }
  };

  const checkSpeakerPermission = async (): Promise<PermissionStatus['speaker']> => {
    try {
      // For speaker, we need to create an audio context and test
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        return 'unavailable';
      }

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator to test audio output
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0; // Silent test
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
      
      // Check if audio context is running
      if (audioContextRef.current.state === 'running') {
        return 'granted';
      }
      
      // Try to resume (might need user interaction)
      await audioContextRef.current.resume();
      return 'granted';
    } catch (error: any) {
      console.warn('Speaker check failed:', error);
      if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
        return 'denied';
      }
      return 'prompt';
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop all tracks immediately since we just needed permission
      stream.getTracks().forEach(track => {
        track.stop();
      });
      
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      setShowPermissionModal(false);
      
      // Add success message
      const permissionMessage: Message = {
        id: Date.now().toString(),
        text: "Microphone access granted! You can now use voice input.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, permissionMessage]);
      
      return true;
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      let errorMessage = "Could not access microphone. ";
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += "Please enable microphone access in your browser settings.";
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No microphone found.";
        setPermissions(prev => ({ ...prev, microphone: 'unavailable' }));
      } else {
        errorMessage += "Please try again.";
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      return false;
    }
  };

  const requestSpeakerPermission = async (): Promise<boolean> => {
    try {
      console.log('Requesting speaker permission...');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume audio context (requires user interaction)
      if (audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }
      
      // Create a silent test to ensure audio output works
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
      
      setPermissions(prev => ({ ...prev, speaker: 'granted' }));
      
      // Add success message
      const permissionMessage: Message = {
        id: Date.now().toString(),
        text: "Speaker access granted! You will now hear audio responses.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, permissionMessage]);
      
      return true;
    } catch (error: any) {
      console.error('Speaker permission error:', error);
      
      let errorMessage = "Could not access speakers. ";
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        errorMessage += "Please allow audio playback in your browser settings.";
        setPermissions(prev => ({ ...prev, speaker: 'denied' }));
      } else {
        errorMessage += "Audio playback may not be supported.";
        setPermissions(prev => ({ ...prev, speaker: 'unavailable' }));
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      return false;
    }
  };

  const requestAllPermissions = async () => {
    const micGranted = await requestMicrophonePermission();
    if (micGranted) {
      await requestSpeakerPermission();
    }
  };

  const handlePermissionAction = async (action: 'allow' | 'deny' | 'settings') => {
    if (action === 'allow') {
      if (permissionModalType === 'microphone') {
        await requestMicrophonePermission();
      } else if (permissionModalType === 'speaker') {
        await requestSpeakerPermission();
      } else if (permissionModalType === 'both') {
        await requestAllPermissions();
      }
    } else if (action === 'settings') {
      // Inform user about manual settings
      const settingsMessage: Message = {
        id: Date.now().toString(),
        text: "Please check your browser settings to enable microphone and speaker access for this site. Look for the lock icon in the address bar.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, settingsMessage]);
      setShowPermissionModal(false);
    } else {
      setShowPermissionModal(false);
      const deniedMessage: Message = {
        id: Date.now().toString(),
        text: "You can enable permissions later by clicking the microphone button or in your browser settings.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, deniedMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Play the initial message when component mounts and speaker is available
  useEffect(() => {
    if (permissions.speaker === 'granted') {
      const timer = setTimeout(() => {
        textToSpeech(INITIAL_SYMPTOM_MESSAGE);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [textToSpeech, permissions.speaker]);

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

        // Play AI messages via text-to-speech if speaker is available
        if (permissions.speaker === 'granted') {
          stepResult.messages.forEach(msg => {
            if (msg.text) {
              textToSpeech(msg.text);
            }
          });
        }

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

          // Play transition messages if speaker is available
          if (permissions.speaker === 'granted') {
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
    // Check microphone permission first
    if (permissions.microphone === 'denied') {
      const message: Message = {
        id: Date.now().toString(),
        text: "Microphone access was denied. Please enable it in your browser settings to use voice input.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setPermissionModalType('microphone');
      setShowPermissionModal(true);
      return;
    }

    if (permissions.microphone === 'unavailable') {
      const message: Message = {
        id: Date.now().toString(),
        text: "No microphone detected. Please connect a microphone to use voice input.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      return;
    }

    if (permissions.microphone === 'prompt') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    // Now handle recording
    if (isRecording) {
      try {
        console.log('Microphone clicked, stopping recording');
        const transcript = await stopRecordingAndTranscribe();
        await handleSendMessage(transcript);
      } catch (error) {
        console.error('Error stopping recording: ', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: 'Failed to transcribe audio. Please try again.',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      try {
        await startRecording();
      } catch (error: any) {
        console.error('Error starting recording:', error);
        let errorMessage = "Unable to start recording. ";
        if (error.name === 'NotAllowedError') {
          errorMessage += "Microphone access was denied. Please check permissions.";
          setPermissions(prev => ({ ...prev, microphone: 'denied' }));
          setPermissionModalType('microphone');
          setShowPermissionModal(true);
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No microphone found.";
          setPermissions(prev => ({ ...prev, microphone: 'unavailable' }));
        } else {
          errorMessage += "Please try again.";
        }
        
        const errorMsg: Message = {
          id: Date.now().toString(),
          text: errorMessage,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  // Permission Modal Component
  const PermissionModal = () => {
    if (!showPermissionModal) return null;

    const getModalContent = () => {
      switch (permissionModalType) {
        case 'microphone':
          return {
            title: "Microphone Access Required",
            message: "To use voice input, please allow access to your microphone.",
            icon: "🎤"
          };
        case 'speaker':
          return {
            title: "Speaker Access Required",
            message: "To hear audio responses, please allow access to your speakers.",
            icon: "🔊"
          };
        case 'both':
          return {
            title: "Audio Permissions Required",
            message: "For the best experience, please allow access to both microphone and speakers.",
            icon: "🎧"
          };
        default:
          return {
            title: "Permissions Required",
            message: "This app requires audio permissions to function properly.",
            icon: "⚙️"
          };
      }
    };

    const content = getModalContent();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">{content.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {content.title}
            </h3>
            <p className="text-gray-600 mb-6">{content.message}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handlePermissionAction('allow')}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Allow Access
            </button>
            
            <button
              onClick={() => handlePermissionAction('settings')}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Open Settings
            </button>
            
            <button
              onClick={() => handlePermissionAction('deny')}
              className="w-full text-gray-500 py-3 rounded-lg hover:text-gray-700 transition-colors"
            >
              Not Now
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            You can change these permissions anytime in your browser settings.
          </div>
        </motion.div>
      </div>
    );
  };

  // Permission status indicator component
  const PermissionIndicator = () => {
    if (permissions.microphone === 'granted' && permissions.speaker === 'granted') {
      return null;
    }

    return (
      <div className="fixed top-16 right-4 z-20">
        <button
          onClick={() => {
            setPermissionModalType('both');
            setShowPermissionModal(true);
          }}
          className="bg-white shadow-md rounded-full p-2 flex items-center gap-2 text-sm"
        >
          {permissions.microphone !== 'granted' && (
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          )}
          {permissions.speaker !== 'granted' && (
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
          )}
          <span className="text-gray-600">Audio</span>
        </button>
      </div>
    );
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
      <PermissionModal />
      <PermissionIndicator />

      {/* Fixed Header */}
      <div className="bg-white shadow-sm p-3 sm:p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-muted-purple text-button-text flex items-center gap-1 sm:gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden xs:inline">Back</span>
        </button>

        {/* Title */}
        <h1 className="text-header text-dark-grey text-sm sm:text-base">Memory Bot</h1>

        {/* Next Button - Only visible during Phase 1 or after Phase 4 */}
        {(phase1Complete && !phase4Complete) && (
          <button
            onClick={saveConversation}
            disabled={isSubmitting}
            className="text-button-text flex items-center gap-1 sm:gap-2 transition-opacity text-muted-purple disabled:opacity-50"
          >
            <span className="text-xs sm:text-sm">{isSubmitting ? 'Saving...' : 'Next'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {/* Invisible placeholder to maintain layout when button is hidden */}
        {(!phase1Complete || phase4Complete) && (
          <div className="w-8 sm:w-12 h-4" />
        )}
      </div>

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto pt-16 sm:pt-20 pb-24 sm:pb-28 px-3 sm:px-4">
        {messages.map((message, index) => {
          if (message.type === 'questionnaire' && message.questionnaire) {
            return (
              <ToggleQuestionnaire
                key={message.id}
                initialMessage={message.questionnaire.initialMessage}
                questions={message.questionnaire.questions}
                maxSelections={message.questionnaire.maxSelections}
                onComplete={(selectedQuestions) => {
                  // Persist selected state into messages[index].questionnaire.questions
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
                <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-4 sm:p-6 max-w-[85%] sm:max-w-[70%] space-y-3 sm:space-y-4">
                  <p className="text-big-text">{message.text}</p>
                  <p className="text-fill-text text-dark-grey opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="pt-3 sm:pt-4">
                    <button
                      onClick={saveConversation}
                      disabled={isSubmitting}
                      className="w-full bg-orange-400 text-white text-button-text font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-full hover:bg-orange-500 transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base"
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
            <div className="bg-light-yellow text-dark-grey rounded-2xl rounded-bl-none p-3 sm:p-4 max-w-[85%] sm:max-w-[70%]">
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
      <div className={`bg-white border-t border-gray-200 p-3 sm:p-4 fixed bottom-0 left-0 right-0 z-10 ${(hasActiveQuestionnaire || phase4Complete) ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex gap-2 sm:gap-3 items-center">
          {/* Microphone Button */}
          <button
            onClick={handleMicClick}
            disabled={hasActiveQuestionnaire || isLoading || phase4Complete || isTranscribing || permissions.microphone === 'denied'}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              isRecording
              ? 'bg-red text-white animate-pulse'
              : permissions.microphone === 'granted'
                ? 'bg-light-purple text-muted-purple'
                : 'bg-gray-200 text-gray-400'
            } ${(hasActiveQuestionnaire || isLoading || phase4Complete) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={permissions.microphone === 'denied' ? 'Microphone access denied' : 
                   permissions.microphone === 'unavailable' ? 'No microphone detected' : 
                   'Use microphone'}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
            {permissions.microphone === 'denied' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Message Input - takes remaining space */}
          <div className="flex-1">
            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading || hasActiveQuestionnaire || phase4Complete} />
          </div>
        </div>
        
        {/* Permission status text */}
        {(permissions.microphone !== 'granted' || permissions.speaker !== 'granted') && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              {permissions.microphone !== 'granted' && permissions.speaker !== 'granted' 
                ? "Microphone and speaker access needed for full features" 
                : permissions.microphone !== 'granted' 
                  ? "Microphone access needed for voice input"
                  : "Speaker access needed for audio responses"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChatPage;