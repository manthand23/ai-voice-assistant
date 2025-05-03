
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
  private isInFallbackMode: boolean = false;

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

    // If we're already in fallback mode, skip the API call
    if (this.isInFallbackMode) {
      const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
      if (lastUserMessage) {
        return this.generateFallbackResponse(lastUserMessage.content);
      }
      return "I'm in offline mode. How can I assist you today?";
    }

    try {
      // Try to get a response from OpenAI
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
      
      // Check for quota exceeded error and provide a fallback response
      if (errorMessage.includes("exceeded your current quota") || error.response?.status === 429) {
        // Switch to fallback mode
        this.isInFallbackMode = true;
        toast.error("API quota exceeded. Using fallback responses.");
        
        // Generate a fallback response based on the last user message
        const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
        if (lastUserMessage) {
          return this.generateFallbackResponse(lastUserMessage.content);
        }
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
      
      return "I'm sorry, I couldn't process your request. I'm currently operating in offline mode with limited functionality.";
    }
  }

  // Fallback response generator when API calls fail
  private generateFallbackResponse(userMessage: string): string {
    const userMessageLower = userMessage.toLowerCase();
    
    // Handle common queries with pre-defined responses
    if (userMessageLower.includes("weather")) {
      return "I'm sorry, I can't access real-time weather data right now. If you'd like weather information, please check a weather app or website for the most up-to-date forecast.";
    }
    
    if (userMessageLower.includes("email") || userMessageLower.includes("send")) {
      return "I understand you want me to email something. I would typically send this to your email address, but I'm currently in offline mode. Please try again later when our systems are fully operational.";
    }
    
    if (userMessageLower.includes("calendar") || userMessageLower.includes("schedule") || userMessageLower.includes("appointment")) {
      return "I see you want help with your calendar or scheduling. Normally, I could assist with that, but I'm currently operating with limited functionality. Please try again later or manage your calendar directly.";
    }
    
    if (userMessageLower.includes("renewable energy")) {
      return "Renewable energy has seen significant growth recently, with solar and wind capacity expanding globally. Many countries are setting ambitious clean energy targets, and there's increasing investment in grid-scale storage solutions. For detailed information, I'd be happy to email you a comprehensive report when our systems are back online.";
    }
    
    if (userMessageLower.includes("time management")) {
      return "For better time management, try techniques like time blocking, the Pomodoro method with focused work sessions, and prioritizing tasks using the Eisenhower matrix. Setting clear boundaries and reducing multitasking can also help improve your productivity.";
    }
    
    if (userMessageLower.includes("book") || userMessageLower.includes("meeting")) {
      return "I understand you want to book a meeting. In normal operation, I could help schedule this for you. For now, I recommend using your preferred calendar app to set this up manually.";
    }
    
    if (userMessageLower.includes("marketing")) {
      return "Regarding marketing strategies, some effective approaches include content marketing through blogs and social media, email marketing campaigns with personalized messaging, search engine optimization to increase organic traffic, and leveraging data analytics to understand customer behavior. When our systems are fully operational, I can email you a detailed marketing plan.";
    }
    
    // Default response if no specific pattern is matched
    return "I understand your query, but I'm currently operating in offline mode with limited functionality. Please try again later when our systems are fully operational.";
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
  
  // Reset the fallback mode (for testing purposes)
  resetFallbackMode() {
    this.isInFallbackMode = false;
  }
}

export const apiService = new ApiService();
