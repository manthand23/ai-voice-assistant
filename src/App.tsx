
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Chat } from "./components/Chat";
import { apiService } from "./services/api";

const queryClient = new QueryClient();

const App = () => {
  const [hasApiKeys, setHasApiKeys] = useState(false);
  
  useEffect(() => {
    // Check if API keys are already set
    setHasApiKeys(apiService.hasApiKeys());
  }, []);

  const handleSetupComplete = () => {
    setHasApiKeys(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {hasApiKeys ? (
            <Chat />
          ) : (
            <WelcomeScreen onComplete={handleSetupComplete} />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
