// src/services/verboseServices.ts
/**
 * Voice Services - Simple WebSocket Implementation
 *
 * WebSocket-based voice services with separate STT and TTS methods.
 * - Speech-to-Text: User speaks → Server transcribes → Returns text
 * - Text-to-Speech: Chatbot text → Server generates audio → Streams back
 *
 * Protocol:
 * - STT: Send {type: 'stt', audio: 'base64...'} → Get {type: 'transcript', text: '...'}
 * - TTS: Send {type: 'tts', text: '...'} → Get audio_chunk messages + audio_end
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// WebSocket URL for verbose service
// Use dynamic URL based on current location for port forwarding compatibility
const getWebSocketURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // Gets host:port from current URL
  return `${protocol}//${host}/ws-verbose`;
};

const WEBSOCKET_URL = getWebSocketURL();

// Message type definitions
interface WebSocketMessage {
  type: string;
  text?: string;
  data?: string;
  message?: string;
  [key: string]: unknown;
}

type MessageHandler = (data: WebSocketMessage) => void;

// ============================================================================
// WebSocket Connection Manager
// ============================================================================

class VoiceWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting: boolean = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return; // Already connected or connecting
    }

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      console.log('[WebSocket] Connecting to:', WEBSOCKET_URL);

      this.ws = new WebSocket(WEBSOCKET_URL);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnecting = false;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.isConnecting = false;
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Closed');
        this.isConnecting = false;
        this.ws = null;
        // Auto-reconnect after 2 seconds
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('[WebSocket] Cannot send - not connected');
    }
  }

  on(messageType: string, handler: MessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  off(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }
}

// Shared WebSocket instance
const voiceWS = new VoiceWebSocket();

// ============================================================================
// React Hook: useVoiceRecording (Speech-to-Text)
// ============================================================================

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptResolveRef = useRef<((text: string) => void) | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    voiceWS.connect().catch(err => {
      console.error('[STT] Failed to connect:', err);
    });

    // Handle transcript messages
    voiceWS.on('transcript', (message) => {
      console.log('[STT] Received transcript:', message.text);
      if (transcriptResolveRef.current && message.text) {
        transcriptResolveRef.current(message.text);
        transcriptResolveRef.current = null;
      }
      setIsTranscribing(false);
    });

    // Handle errors
    voiceWS.on('error', (message) => {
      console.error('[STT] Error:', message.message);
      setIsTranscribing(false);
    });

    return () => {
      voiceWS.off('transcript');
      voiceWS.off('error');
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('[STT] Recording started');
    } catch (error) {
      console.error('[STT] Error starting recording:', error);
      throw error;
    }
  }, []);

  const stopRecordingAndTranscribe = useCallback(async (): Promise<string> => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      throw new Error('No active recording');
    }

    return new Promise<string>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        setIsRecording(false);
        setIsTranscribing(true);

        try {
          // Combine audio chunks into blob
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm;codecs=opus'
          });

          console.log('[STT] Audio recorded:', audioBlob.size, 'bytes');

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64, prefix

            // Store resolve function for when transcript arrives
            transcriptResolveRef.current = resolve;

            // Send STT request via WebSocket
            voiceWS.send({
              type: 'stt',
              audio: base64Audio
            });

            console.log('[STT] Sent audio for transcription');
          };

          reader.onerror = () => {
            setIsTranscribing(false);
            reject(new Error('Failed to read audio blob'));
          };

          reader.readAsDataURL(audioBlob);

          // Timeout after 30 seconds
          setTimeout(() => {
            if (transcriptResolveRef.current) {
              transcriptResolveRef.current = null;
              setIsTranscribing(false);
              reject(new Error('Transcription timeout'));
            }
          }, 30000);

        } catch (error) {
          setIsTranscribing(false);
          reject(error);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecordingAndTranscribe
  };
}

// ============================================================================
// React Hook: useAudioPlayer (Text-to-Speech)
// ============================================================================

export function useAudioPlayer() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  // const audioContextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const audioChunksRef = useRef<string[]>([]);

  // Define processQueue before useEffect so it can be used in the dependency array
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const text = queueRef.current.shift();

    if (text) {
      console.log('[TTS] Speaking:', text);
      audioChunksRef.current = [];
      setIsSpeaking(true);

      // Send TTS request via WebSocket
      voiceWS.send({
        type: 'tts',
        text: text
      });
    } else {
      isProcessingRef.current = false;
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    voiceWS.connect().catch(err => {
      console.error('[TTS] Failed to connect:', err);
    });

    // Handle audio chunk messages
    voiceWS.on('audio_chunk', (message) => {
      if (message.data) {
        audioChunksRef.current.push(message.data);
      }
    });

    // Handle audio end message
    voiceWS.on('audio_end', async () => {
      console.log('[TTS] Received all audio chunks:', audioChunksRef.current.length);

      try {
        // Combine all chunks and play
        await playAudioChunks(audioChunksRef.current);
        audioChunksRef.current = [];
        setIsSpeaking(false);
        isProcessingRef.current = false;

        // Process next item in queue
        setTimeout(() => {
          processQueue();
        }, 100);
      } catch (error) {
        console.error('[TTS] Error playing audio:', error);
        audioChunksRef.current = [];
        setIsSpeaking(false);
        isProcessingRef.current = false;
      }
    });

    // Handle errors
    voiceWS.on('error', (message) => {
      console.error('[TTS] Error:', message.message);
      audioChunksRef.current = [];
      setIsSpeaking(false);
      isProcessingRef.current = false;
    });

    return () => {
      voiceWS.off('audio_chunk');
      voiceWS.off('audio_end');
      voiceWS.off('error');
    };
  }, [processQueue]);

  const playAudioChunks = async (chunks: string[]) => {
    try {
      console.log('[TTS] Processing', chunks.length, 'base64 chunks');

      // Decode each chunk individually to avoid base64 padding issues
      const binaryChunks: Uint8Array[] = [];
      let totalLength = 0;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunk = chunks[i];
          const binaryString = atob(chunk);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          binaryChunks.push(bytes);
          totalLength += bytes.length;
        } catch (error) {
          console.error(`[TTS] Error decoding chunk ${i}:`, error);
          console.error(`[TTS] Chunk ${i} data:`, chunks[i].substring(0, 50));
          throw error;
        }
      }

      console.log('[TTS] Decoded total bytes:', totalLength);

      // Combine all binary chunks into one array
      const combinedBytes = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of binaryChunks) {
        combinedBytes.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('[TTS] Combined bytes length:', combinedBytes.length);

      // Create blob and play
      const audioBlob = new Blob([combinedBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };

      audio.play().catch(reject);
    });
    } catch (error) {
      console.error('[TTS] Error playing audio chunks:', error);
      throw error;
    }
  };

  const speak = useCallback((text: string) => {
    console.log('[TTS] Adding to queue:', text);
    queueRef.current.push(text);
    console.log('[TTS] Queue length:', queueRef.current.length);
    processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    console.log('[TTS] Clearing queue');
    queueRef.current = [];
    audioChunksRef.current = [];
    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    speak,
    clearQueue,
    queueLength: queueRef.current.length,
    isActive: () => isProcessingRef.current
  };
}
