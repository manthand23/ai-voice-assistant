
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { LayoutDashboard } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
  onDashboard?: () => void;
}

export function WelcomeScreen({ onComplete, onDashboard }: WelcomeScreenProps) {
  // Hardcoded API keys - NOTE: In a real production app, these would be environment variables
  const elevenLabsApiKey = "sk_e2103037e1030bf853e28411fe89320cdfc979d42c50dcad";
  const openAiApiKey = "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";
  
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for existing user data on load
  useEffect(() => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      const parsedData = JSON.parse(userData);
      setUserName(parsedData.name || "");
      setEmail(parsedData.email || "");
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName) {
      toast.error("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    
    // Save API keys automatically
    apiService.saveApiKeys(elevenLabsApiKey, openAiApiKey);
    
    // Save user data
    const userData = {
      name: userName,
      email: email,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem("user_data", JSON.stringify(userData));
    
    // Look for previous conversation history with this user
    const history = JSON.parse(localStorage.getItem("conversation_history") || "[]");
    const userHistoryExists = history.some((conv: any) => {
      const messages = conv.messages || [];
      return messages.some((msg: any) => 
        msg.content && msg.content.includes(`Hello ${userName}!`)
      );
    });
    
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {onDashboard && (
          <Button 
            variant="outline" 
            onClick={onDashboard}
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>View Dashboard</span>
          </Button>
        )}
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-assistant-primary mb-2">AI Voice Assistant</h1>
          <p className="text-lg text-muted-foreground">Your Personal AI Assistant</p>
        </div>
        
        <div className="glass-effect rounded-2xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information Section */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your Information</h2>
              
              <div className="space-y-2">
                <label htmlFor="user-name" className="text-sm font-medium">
                  Your Name
                </label>
                <Input
                  id="user-name"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="user-email" className="text-sm font-medium">
                  Your Email
                </label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Start Talking"}
            </Button>
          </form>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Your personal information is stored locally in your browser.</p>
        </div>
      </div>
    </div>
  );
}
