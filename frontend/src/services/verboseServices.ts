// src/services/verboseServices.ts

const IMAGE_GEN_SERVICE_URL = '/microservice';

// ============================================================================
// SPEECH-TO-TEXT SERVICES
// ============================================================================

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

/**
 * Transcribes audio file to text using the microservice API
 * @param audioFile - The audio file to transcribe
 * @returns Transcription result with success status and transcript or error
 */
export async function transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await fetch(`${IMAGE_GEN_SERVICE_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        transcript: result.transcript
      };
    } else {
      throw new Error(result.error || 'Transcription failed');
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to service'
    };
  }
}

/**
 * Starts recording audio from the user's microphone
 * @returns MediaRecorder instance and chunks array for managing the recording
 */
export async function startRecording(): Promise<{
  mediaRecorder: MediaRecorder;
  chunks: Blob[];
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  mediaRecorder.start();
  return { mediaRecorder, chunks };
}

/**
 * Stops recording and returns the audio blob
 * @param mediaRecorder - The MediaRecorder instance to stop
 * @param chunks - Array of audio chunks
 * @returns Promise that resolves to the audio File
 */
export function stopRecording(
  mediaRecorder: MediaRecorder,
  chunks: Blob[]
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.onstop = () => {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      resolve(audioFile);
    };

    mediaRecorder.stop();
  });
}

// ============================================================================
// TEXT-TO-SPEECH SERVICES
// ============================================================================

export interface TextToSpeechResult {
  success: boolean;
  audioFilePath?: string;
  error?: string;
}

/**
 * Converts text to speech and returns the audio file path
 * @param text - The text to convert to speech
 * @returns Result with audio file path or error
 */
export async function convertTextToSpeech(text: string): Promise<TextToSpeechResult> {
  try {
    const response = await fetch(`${IMAGE_GEN_SERVICE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.audio_file_path) {
      return {
        success: true,
        audioFilePath: result.audio_file_path
      };
    } else {
      throw new Error(result.error || 'Text-to-speech conversion failed');
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to connect to service'
    };
  }
}

/**
 * Downloads audio file from the microservice
 * @param filename - The filename to download
 * @returns Audio blob
 */
export async function downloadAudioFile(filename: string): Promise<Blob> {
  const audioResponse = await fetch(`${IMAGE_GEN_SERVICE_URL}/download-audio/${filename}`);

  if (!audioResponse.ok) {
    throw new Error('Failed to download audio');
  }

  return await audioResponse.blob();
}

/**
 * Plays audio blob and returns a promise that resolves when playback completes
 * @param audioBlob - The audio blob to play
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(audioBlob: Blob): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    let hasEnded = false;

    audio.onended = () => {
      if (hasEnded) return;
      hasEnded = true;
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 100);
      resolve(audio);
    };

    audio.onerror = () => {
      if (hasEnded) return;
      hasEnded = true;
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 100);
      reject(new Error('Audio playback error'));
    };

    audio.play().catch((err) => {
      if (hasEnded) return;
      hasEnded = true;
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 100);
      reject(err);
    });
  });
}

/**
 * Complete text-to-speech pipeline: converts text to speech, downloads, and plays audio
 * @param text - The text to convert and play
 * @returns Promise that resolves with the audio element when playback completes
 */
export async function textToSpeechComplete(text: string): Promise<HTMLAudioElement> {
  // Convert text to speech
  const conversionResult = await convertTextToSpeech(text);

  if (!conversionResult.success || !conversionResult.audioFilePath) {
    throw new Error(conversionResult.error || 'Text-to-speech conversion failed');
  }

  // Extract filename from path
  const filename = conversionResult.audioFilePath.split(/[/\\]/).pop();
  if (!filename) {
    throw new Error('Invalid audio file path');
  }

  // Download audio file
  const audioBlob = await downloadAudioFile(filename);

  // Play audio
  return await playAudio(audioBlob);
}
