
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
      // Convert audio blob to File object
      const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
      
      console.log("Using OpenAI API key for transcription:", this.openAiApiKey.substring(0, 10) + "...");
      console.log("Audio file size:", file.size, "bytes");
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", "en"); // You can make this configurable
      
      // Send to OpenAI Whisper API
      const response = await axios.post(
        `${OPENAI_API_URL}/audio/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.text) {
        console.log("Transcription result:", response.data.text);
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
      toast.error(`Transcription error: ${errorMessage}`);
      
      // If we get a quota error, suggest checking the billing dashboard
      if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
        toast.error("OpenAI quota exceeded. Please check your OpenAI billing dashboard to ensure your payment method is valid and you have sufficient credits.");
      }
      
      return "Could not transcribe audio. Please try again.";
    }
  }

  setVoiceId(voiceId: string) {
    this.voiceId = voiceId;
  }
}

export const apiService = new ApiService();
