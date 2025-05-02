
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiService } from "@/services/api";
import { ThemeToggle } from "./ThemeToggle";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!elevenLabsApiKey || !openAiApiKey) {
      return;
    }
    
    setIsLoading(true);
    apiService.saveApiKeys(elevenLabsApiKey, openAiApiKey);
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-assistant-primary mb-2">Echo Speak</h1>
          <p className="text-lg text-muted-foreground">Your AI Voice Assistant</p>
        </div>
        
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="elevenlabs-key" className="text-sm font-medium">
                ElevenLabs API Key
              </label>
              <Input
                id="elevenlabs-key"
                placeholder="Enter your ElevenLabs API key"
                value={elevenLabsApiKey}
                onChange={(e) => setElevenLabsApiKey(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="openai-key" className="text-sm font-medium">
                OpenAI API Key
              </label>
              <Input
                id="openai-key"
                placeholder="Enter your OpenAI API key"
                value={openAiApiKey}
                onChange={(e) => setOpenAiApiKey(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Get Started"}
            </Button>
          </form>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Your API keys are stored locally in your browser.</p>
          <p>They are never sent to our servers.</p>
        </div>
      </div>
    </div>
  );
}
