
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Chat } from "./components/Chat";
import { Dashboard } from "./components/Dashboard";
import { apiService } from "./services/api";

const queryClient = new QueryClient();

const App = () => {
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [currentView, setCurrentView] = useState<"welcome" | "chat" | "dashboard">("welcome");
  
  useEffect(() => {
    // Check if API keys are already set
    setHasApiKeys(apiService.hasApiKeys());
  }, []);

  const handleSetupComplete = () => {
    setHasApiKeys(true);
    setCurrentView("chat");
  };

  const handleEndCall = () => {
    setCurrentView("welcome");
  };

  const handleDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleBackToChat = () => {
    setCurrentView("welcome");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {!hasApiKeys ? (
            <WelcomeScreen onComplete={handleSetupComplete} onDashboard={handleDashboard} />
          ) : (
            <>
              {currentView === "chat" && (
                <Chat 
                  onEndCall={handleEndCall} 
                  onDashboard={handleDashboard} 
                />
              )}
              {currentView === "welcome" && (
                <WelcomeScreen onComplete={handleSetupComplete} onDashboard={handleDashboard} />
              )}
              {currentView === "dashboard" && (
                <Dashboard onBackToChat={handleBackToChat} />
              )}
            </>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
