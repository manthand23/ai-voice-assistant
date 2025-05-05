
class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private onDataAvailable: ((data: Blob) => void) | null = null;
  private isRecording: boolean = false;

  async startRecording(onDataCallback: (data: Blob) => void) {
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
      
      // Using audio/wav MIME type for better compatibility with Whisper
      // Fall back to webm if wav isn't supported
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

      // Use smaller time slices for more frequent data chunks (better streaming)
      this.mediaRecorder.start(100);
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error("Error starting voice recording:", error);
      return false;
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    try {
      this.mediaRecorder.stop();
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
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
}

export const voiceRecorder = new VoiceRecorder();
