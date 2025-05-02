
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

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        if (this.onDataAvailable) {
          this.onDataAvailable(audioBlob);
        }
      });

      this.mediaRecorder.start();
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
