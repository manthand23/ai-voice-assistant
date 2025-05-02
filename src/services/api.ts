
import axios from "axios";
import { toast } from "sonner";

const ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1";
const OPENAI_API_URL = "https://api.openai.com/v1";

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

class ApiService {
  private elevenLabsApiKey: string | null = null;
  private openAiApiKey: string | null = null;
  private voiceId: string = "EXAVITQu4vr4xnSDxMaL"; // Sarah voice ID

  constructor() {
    this.loadApiKeys();
  }

  loadApiKeys() {
    this.elevenLabsApiKey = localStorage.getItem("eleven_labs_api_key");
    this.openAiApiKey = localStorage.getItem("openai_api_key");
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
      const response = await axios.post(
        `${OPENAI_API_URL}/chat/completions`,
        {
          model: "gpt-4o-mini",
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

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating text response:", error);
      toast.error("Error generating response. Please try again.");
      return "I'm sorry, I'm having trouble responding right now. Please try again later.";
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

  // In a production app, you would implement this method to convert audio to text
  // This is a placeholder that would be replaced with actual API calls
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    // In a real implementation, you would:
    // 1. Send the audio to OpenAI's Whisper API or another STT service
    // 2. Get back the transcription
    // 3. Return it
    
    console.log("Transcribing audio...");
    
    // Simulate a delay for the API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return "This is a placeholder for what the user said. In a real implementation, this would be transcribed from the audio.";
  }

  setVoiceId(voiceId: string) {
    this.voiceId = voiceId;
  }
}

export const apiService = new ApiService();
