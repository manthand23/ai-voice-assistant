
class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onDataAvailable: ((data: Blob) => void) | null = null;
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meter: number = 0;
  private maxRecordingDuration: number = 60000; // 60 seconds max
  private recordingTimeout: ReturnType<typeof setTimeout> | null = null;

  async startRecording(onDataCallback: (data: Blob) => void, onAudioLevel?: (level: number) => void) {
    if (this.isRecording) return;

    try {
      this.audioChunks = [];
      this.onDataAvailable = onDataCallback;

      // Using optimal audio constraints for Whisper API
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Whisper works best with 16kHz audio
          channelCount: 1    // Mono audio for better transcription
        } 
      });
      
      // Set up audio context for level monitoring
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;
      
      // If browser supports wav use it, otherwise use webm
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : 'audio/webm';
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      });

      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener("stop", () => {
        // Combine audio chunks into a single blob
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        if (this.onDataAvailable) {
          this.onDataAvailable(audioBlob);
        }
      });

      // Start audio level monitoring if callback provided
      if (onAudioLevel && this.analyser) {
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkAudioLevel = () => {
          if (!this.isRecording) return;
          
          this.analyser!.getByteFrequencyData(dataArray);
          let sum = 0;
          
          // Calculate average frequency amplitude
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          
          this.meter = sum / dataArray.length / 255; // Normalize to 0-1
          onAudioLevel(this.meter);
          
          requestAnimationFrame(checkAudioLevel);
        };
        
        requestAnimationFrame(checkAudioLevel);
      }

      // Use smaller time slices for more frequent data chunks
      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      // Set maximum recording duration
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.maxRecordingDuration);
      
      return true;
    } catch (error) {
      console.error("Error starting voice recording:", error);
      return false;
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    try {
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }
      
      this.mediaRecorder.stop();
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio context
      if (this.audioContext) {
        // Only close if supported and not already closed
        if (this.audioContext.state !== 'closed' && typeof this.audioContext.close === 'function') {
          this.audioContext.close().catch(e => console.error("Error closing audio context:", e));
        }
        this.audioContext = null;
        this.analyser = null;
      }
      
      this.isRecording = false;
      return true;
    } catch (error) {
      console.error("Error stopping voice recording:", error);
      return false;
    }
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }
  
  getCurrentAudioLevel() {
    return this.meter;
  }
  
  setMaxRecordingDuration(durationMs: number) {
    this.maxRecordingDuration = durationMs;
  }
}

export const voiceRecorder = new VoiceRecorder();
