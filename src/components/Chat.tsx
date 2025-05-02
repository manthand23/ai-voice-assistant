
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, PhoneOff, LayoutDashboard } from "lucide-react";
import { ChatMessageComponent } from "./ChatMessage";
import { apiService, ChatMessage } from "@/services/api";
import { voiceRecorder } from "@/services/voiceRecorder";
import { AudioVisualizer } from "./AudioVisualizer";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dashboard } from "./Dashboard";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you today?",
    timestamp: Date.now(),
  },
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const userData = localStorage.getItem("user_data");
  const [userName, setUserName] = useState<string>(userData ? JSON.parse(userData).name : "");

  useEffect(() => {
    // Custom greeting if user name exists
    if (userName) {
      const customGreeting: ChatMessage = {
        role: "assistant",
        content: `Hello ${userName}! Welcome back. How can I help you today?`,
        timestamp: Date.now(),
      };
      setMessages([customGreeting]);
    }
  }, [userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEndCall = () => {
    setIsSpeaking(false);
    if (isRecording) {
      voiceRecorder.stopRecording();
      setIsRecording(false);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Save conversation history if needed
    // localStorage.setItem("conversation_history", JSON.stringify(messages));
    
    toast.success("Call ended successfully");
    
    // Navigate back to welcome screen
    if (window.confirm("End the current call?")) {
      window.location.reload();
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      voiceRecorder.stopRecording();
    } else {
      const success = await voiceRecorder.startRecording(handleVoiceData);
      if (success) {
        setIsRecording(true);
        toast.info("Listening... Tap to stop.");
      } else {
        toast.error("Could not access microphone. Check permissions.");
      }
    }
  };

  const handleVoiceData = async (audioBlob: Blob) => {
    // In a real implementation, you would use speech-to-text here
    // For this demo, we'll just use a placeholder message
    const userMessage: ChatMessage = {
      role: "user",
      content: "This is a voice message. In a real implementation, we would convert this to text.",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await processUserMessage(userMessage);
  };

  const processUserMessage = async (userMessage: ChatMessage) => {
    setIsProcessing(true);

    try {
      // Generate text response from OpenAI
      const assistantResponse = await apiService.generateTextResponse([
        ...messages,
        userMessage,
      ]);

      // Add the assistant message to the chat
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: assistantResponse,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Generate and play speech for the assistant's response
      setIsSpeaking(true);
      const audioData = await apiService.generateSpeech(assistantResponse);
      
      // Create audio blob and play it
      const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("An error occurred while processing your message.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioEnded = () => {
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-assistant-primary flex items-center justify-center">
            <span className="text-white font-semibold">AI</span>
          </div>
          <h1 className="text-xl font-semibold">Echo Speak</h1>
        </div>
        <div className="flex items-center gap-2">
          <AudioVisualizer isActive={isSpeaking} />
          
          {/* Dashboard Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <LayoutDashboard className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Dashboard userName={userName} />
            </SheetContent>
          </Sheet>
          
          <ThemeToggle />
          
          {/* End Call Button */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleEndCall}
            className="rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="sr-only">End Call</span>
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessageComponent key={index} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Input Button Only - No Text Input */}
      <div className="p-4 border-t">
        <div className="max-w-3xl mx-auto flex justify-center">
          <Button
            size="lg"
            onClick={handleVoiceToggle}
            className={`rounded-full w-16 h-16 ${isRecording ? "bg-assistant-primary text-white" : ""}`}
          >
            {isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden audio element for speech playback */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: "none" }}
      />
    </div>
  );
}
