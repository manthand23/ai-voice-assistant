
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
  private elevenLabsApiKey: string | null = "sk_e2103037e1030bf853e28411fe89320cdfc979d42c50dcad";
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

  // Implement an actual transcription function using OpenAI's Whisper API
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // In a real implementation, you would send this to OpenAI Whisper API
      console.log("Transcribing audio...");
      
      // Here we'll simulate a transcription with a delay
      const transcriptions = [
        "Can you tell me more about AI voice assistants?",
        "I need help with my calendar for next week.",
        "What's the weather forecast for tomorrow?",
        "Can you send me information about new marketing strategies to my email?",
        "I'd like to book a meeting for tomorrow afternoon.",
        "Tell me about the latest developments in renewable energy and also how to improve my time management skills.",
      ];
      
      // Wait for a short time to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a random transcription
      return transcriptions[Math.floor(Math.random() * transcriptions.length)];
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Error transcribing audio. Please try again.");
      return "Could not transcribe audio. Please try again.";
    }
  }

  setVoiceId(voiceId: string) {
    this.voiceId = voiceId;
  }
}

export const apiService = new ApiService();
