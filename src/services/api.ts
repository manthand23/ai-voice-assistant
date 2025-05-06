import axios from "axios";
import { toast } from "sonner";

const ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1";
const OPENAI_API_URL = "https://api.openai.com/v1";

export interface ChatMessage {
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: number;
}

class ApiService {
  private elevenLabsApiKey: string | null = "sk_c94b29279b2e053b449b5c64943363c510c642b709fc79ff";
  private openAiApiKey: string | null = "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";
  private voiceId: string = "EXAVITQu4vr4xnSDxMaL"; // Sarah voice ID
  private transcriptionAttempts: number = 0;
  private maxTranscriptionAttempts: number = 3;

  constructor() {
    this.loadApiKeys();
  }

  loadApiKeys() {
    // If keys are stored in localStorage, use those (allows for user override)
    const storedElevenLabsKey = localStorage.getItem("eleven_labs_api_key");
    const storedOpenAiKey = localStorage.getItem("openai_api_key");
    
    if (storedElevenLabsKey) this.elevenLabsApiKey = storedElevenLabsKey;
    if (storedOpenAiKey) this.openAiApiKey = storedOpenAiKey;
  }

  saveApiKeys(elevenLabsApiKey: string, openAiApiKey: string) {
    localStorage.setItem("eleven_labs_api_key", elevenLabsApiKey);
    localStorage.setItem("openai_api_key", openAiApiKey);
    this.elevenLabsApiKey = elevenLabsApiKey;
    this.openAiApiKey = openAiApiKey;
  }

  hasApiKeys() {
    return !!this.elevenLabsApiKey && !!this.openAiApiKey;
  }

  async generateTextResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.openAiApiKey) {
      throw new Error("OpenAI API key is not set");
    }

    try {
      console.log("Using OpenAI API key:", this.openAiApiKey.substring(0, 10) + "...");
      
      // Get a response from OpenAI
      const response = await axios.post(
        `${OPENAI_API_URL}/chat/completions`,
        {
          model: "gpt-4o-mini", // Using the recommended model
          messages: messages.map(({ role, content }) => ({ role, content })),
          max_tokens: 1000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openAiApiKey}`,
          },
        }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        console.error("Unexpected API response structure:", response.data);
        return "I apologize, but I received an unexpected response format. Please try again.";
      }
    } catch (error: any) {
      console.error("Error generating text response:", error);
      const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
      console.error("Error details:", errorMessage);
      toast.error(`Error: ${errorMessage}`);
      
      return "I'm sorry, I couldn't process your request right now. Please try again later.";
    }
  }

  async generateSpeech(text: string): Promise<ArrayBuffer> {
    if (!this.elevenLabsApiKey) {
      throw new Error("ElevenLabs API key is not set");
    }

    try {
      const response = await axios.post(
        `${ELEVEN_LABS_API_URL}/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": this.elevenLabsApiKey,
          },
          responseType: "arraybuffer",
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating speech:", error);
      toast.error("Error generating speech. Please try again.");
      throw error;
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!this.openAiApiKey) {
      throw new Error("OpenAI API key is not set");
    }

    try {
      // Check if audio is too short (likely silence)
      if (audioBlob.size < 5000) { // If less than 5KB
        toast.warning("Recording too short. Please speak for longer.");
        return "Could not transcribe audio. Please try again.";
      }

      // Convert audio blob to File object with proper format
      const audioType = audioBlob.type || "audio/webm";
      const fileExtension = audioType.includes('wav') ? 'wav' : 'webm';
      const file = new File([audioBlob], `recording.${fileExtension}`, { type: audioType });
      
      console.log("Transcribing audio with OpenAI...");
      console.log("Audio file details:", {
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        name: file.name
      });
      console.log("Using OpenAI API key:", this.openAiApiKey.substring(0, 10) + "...");
      
      // Create form data with optimized parameters for Whisper
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", "en");
      formData.append("response_format", "json"); // Request JSON response
      formData.append("temperature", "0.0"); // Lower temperature for more accurate transcription
      
      // Send to OpenAI Whisper API
      const response = await axios.post(
        `${OPENAI_API_URL}/audio/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data && response.data.text) {
        console.log("Transcription successful:", response.data.text);
        this.transcriptionAttempts = 0; // Reset attempts on success
        return response.data.text;
      } else {
        console.error("Unexpected transcription response:", response);
        toast.error("Failed to transcribe audio");
        return "Could not transcribe audio. Please try again.";
      }
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
      console.error("Transcription error details:", errorMessage);
      
      // Increase attempt counter
      this.transcriptionAttempts++;
      
      // Provide more helpful error messages based on common Whisper API issues
      if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
        toast.error("OpenAI quota exceeded. Please check your OpenAI billing dashboard.");
        return "Sorry, there's an issue with my transcription service. Let me try a different approach.";
      } else if (errorMessage.includes("file too large")) {
        toast.error("Audio file is too large. Please record a shorter message.");
        return "Your message was too long. Please try a shorter message.";
      } else if (errorMessage.includes("could not recognize speech") || !errorMessage) {
        toast.error("No clear speech detected. Please speak more clearly and try again.");
        return "I couldn't hear you clearly. Please try again in a quiet environment.";
      } else if (this.transcriptionAttempts >= this.maxTranscriptionAttempts) {
        toast.error("Multiple transcription attempts failed. Try typing instead.");
        return "I'm having trouble understanding your speech. You might want to type your message instead.";
      }
      
      toast.error(`Transcription error: ${errorMessage}`);
      return "Could not transcribe audio. Please try again.";
    }
  }

  setVoiceId(voiceId: string) {
    this.voiceId = voiceId;
  }
  
  resetTranscriptionAttempts() {
    this.transcriptionAttempts = 0;
  }
}

export const apiService = new ApiService();
