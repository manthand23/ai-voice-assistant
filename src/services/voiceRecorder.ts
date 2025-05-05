/**
 * Voice Recorder Service
 * Created by Manthan D. on May 2, 2025
 * 
 * This module handles all voice recording functionality for our AI assistant.
 * It manages recording, audio processing, and level monitoring.
 * 
 * NOTE: Tuned specifically for Whisper API compatibility
 */

// TODO: Consider adding noise gate feature in v2.0
class VoiceRecorder {
  // Core recorder components
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  // Callback handler
  private onDataAvailable: ((data: Blob) => void) | null = null;
  
  // State tracking
  private isRecording: boolean = false;
  
  // Audio analysis tools
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meter: number = 0;
  
  // Config settings - should probably move to a config file later
  private maxRecordingDuration: number = 60000; // 60s max to prevent memory issues
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Starts recording audio from the user's microphone
   * @param onDataCallback Function to handle the final audio blob
   * @param onAudioLevel Optional callback for audio level monitoring
   * @returns Promise<boolean> Success status
   */
  async startRecording(onDataCallback: (data: Blob) => void, onAudioLevel?: (level: number) => void): Promise<boolean> {
    // Don't start if already recording
    if (this.isRecording) return false;

    try {
      // Reset state
      this.audioChunks = [];
      this.onDataAvailable = onDataCallback;

      // Let's grab that microphone!
      // The settings below are specifically tuned for Whisper API's preferred format
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,    // Remove echo for cleaner audio
          noiseSuppression: true,    // Filter out background noise
          autoGainControl: true,     // Normalize volume levels
          sampleRate: 16000,         // 16kHz is optimal for Whisper
          channelCount: 1            // Mono audio works better for speech recognition
        } 
      });
      
      // Set up audio analyzer for level meters
      // This helps us visualize when the user is speaking
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256; // Fast enough for visualization without lag
      
      // Some browsers support different formats - WAV is preferred if available
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : 'audio/webm'; // Fallback to webm - works on most browsers
      
      // Create the recorder with quality settings - higher bitrate for cleaner audio
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000 // CD quality is ~128kbps
      });

      // Handle data chunks as they come in
      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      // Process the complete recording when stopped
      this.mediaRecorder.addEventListener("stop", () => {
        // Combine all audio chunks into one blob
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (this.onDataAvailable) {
          this.onDataAvailable(audioBlob);
        }
      });

      // If they want audio level monitoring, let's set that up
      if (onAudioLevel && this.analyser) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        const checkAudioLevel = () => {
          // Stop checking if we're not recording anymore
          if (!this.isRecording) return;
          
          // Get current audio frequency data
          this.analyser!.getByteFrequencyData(dataArray);
          let sum = 0;
          
          // Average the frequencies to get overall volume level
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          
          // Normalize to 0-1 range for easier consumption
          this.meter = sum / dataArray.length / 255; 
          onAudioLevel(this.meter);
          
          // Keep checking at animation frame rate
          requestAnimationFrame(checkAudioLevel);
        };
        
        // Kick off the level monitoring
        requestAnimationFrame(checkAudioLevel);
      }

      // Start recording - with frequent data chunks for responsive UX
      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      // Safety timeout to prevent super long recordings
      // (also helps prevent memory issues in mobile browsers)
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          console.log("Max recording duration reached, auto-stopping.");
          this.stopRecording();
        }
      }, this.maxRecordingDuration);
      
      return true;
    } catch (error) {
      console.error("Mic access failed:", error);
      return false;
    }
  }

  /**
   * Stops the ongoing recording and processes the audio
   * @returns boolean Success status
   */
  stopRecording(): boolean {
    // Can't stop what isn't running
    if (!this.isRecording || !this.mediaRecorder) return false;

    try {
      // Clear the auto-stop timeout if it exists
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }
      
      // Stop the recorder - this will trigger our "stop" event handler
      this.mediaRecorder.stop();
      
      // Be nice and free up the microphone
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio processing resources
      if (this.audioContext) {
        // Some older browsers don't support closing
        if (this.audioContext.state !== 'closed' && typeof this.audioContext.close === 'function') {
          this.audioContext.close().catch(e => console.error("AudioContext cleanup failed:", e));
        }
        this.audioContext = null;
        this.analyser = null;
      }
      
      this.isRecording = false;
      return true;
    } catch (error) {
      console.error("Recording stop failed:", error);
      return false;
    }
  }

  // Public getters/setters for state management

  /**
   * Check if currently recording
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
  
  /**
   * Get the current audio level (0-1)
   */
  getCurrentAudioLevel(): number {
    return this.meter;
  }
  
  /**
   * Update the maximum recording duration
   * @param durationMs New duration in milliseconds
   */
  setMaxRecordingDuration(durationMs: number): void {
    this.maxRecordingDuration = durationMs;
  }
}

// Create a singleton instance
// This way we don't have multiple recorders fighting over the mic
export const voiceRecorder = new VoiceRecorder();
