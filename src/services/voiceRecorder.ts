class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  private onDataAvailable: ((data: Blob) => void) | null = null;
  
  private isRecording: boolean = false;
  
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meter: number = 0;
  
  // Config settings - should probably move to a config file later
  private maxRecordingDuration: number = 60000; // 60s max to prevent memory issues
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;

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
          noiseSuppression: true,    
          autoGainControl: true,     
          sampleRate: 16000,        
          channelCount: 1           
        } 
      });
      
      // Set up audio analyzer for level meters
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256; 
      
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : 'audio/webm'; 
      
      // Create the recorder with quality settings 
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000 
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
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio processing resources
      if (this.audioContext) {
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

  setMaxRecordingDuration(durationMs: number): void {
    this.maxRecordingDuration = durationMs;
  }
}

export const voiceRecorder = new VoiceRecorder();
