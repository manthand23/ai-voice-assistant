
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, LayoutDashboard } from "lucide-react";
import { ChatMessageComponent } from "./ChatMessage";
import { apiService, ChatMessage } from "@/services/api";
import { voiceRecorder } from "@/services/voiceRecorder";
import { AudioVisualizer } from "./AudioVisualizer";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

interface ChatProps {
  onEndCall: () => void;
  onDashboard: () => void;
}

export function Chat({ onEndCall, onDashboard }: ChatProps) {
  const userData = localStorage.getItem("user_data") ? JSON.parse(localStorage.getItem("user_data")!) : null;
  const userName = userData?.name || "there";
  
  // Initial greeting based on the user name
  const initialGreeting = `Hello ${userName}! I'm your AI Voice Assistant. How can I help you today?`;
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: initialGreeting,
      timestamp: Date.now(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Speak initial greeting when component mounts
  useEffect(() => {
    const speakInitialGreeting = async () => {
      try {
        setIsSpeaking(true);
        const audioData = await apiService.generateSpeech(initialGreeting);
        
        // Create audio blob and play it
        const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } catch (error) {
        console.error("Error speaking initial greeting:", error);
        toast.error("Could not play the welcome message. Please check your API keys.");
      }
    };
    
    // Increment conversation counter
    const totalConversations = localStorage.getItem("total_conversations") || "0";
    localStorage.setItem("total_conversations", (parseInt(totalConversations) + 1).toString());
    
    // Store this conversation in history
    const conversationHistory = JSON.parse(localStorage.getItem("conversation_history") || "[]");
    const newConversation = {
      id: Date.now(),
      date: new Date().toISOString(),
      messages: [messages[0]]
    };
    conversationHistory.push(newConversation);
    localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
    
    // Speak greeting
    speakInitialGreeting();
  }, []);

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
    
    // Save conversation history
    const conversationHistory = JSON.parse(localStorage.getItem("conversation_history") || "[]");
    const currentConversation = conversationHistory[conversationHistory.length - 1];
    if (currentConversation) {
      currentConversation.messages = messages;
      localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
    }
    
    // Call the parent component's handler
    onEndCall();
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
    try {
      setIsProcessing(true);
      
      // In a production app, you would send this audio to a speech-to-text API
      // For now, we'll use a placeholder message
      const transcription = "This is a transcription of what the user said. In a real implementation, this would come from a speech-to-text service.";
      
      const userMessage: ChatMessage = {
        role: "user",
        content: transcription,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      await processUserMessage(userMessage);
    } catch (error) {
      console.error("Error processing voice data:", error);
      toast.error("Error processing your voice input.");
    } finally {
      setIsProcessing(false);
    }
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

      // Save to conversation history
      const conversationHistory = JSON.parse(localStorage.getItem("conversation_history") || "[]");
      const currentConversation = conversationHistory[conversationHistory.length - 1];
      if (currentConversation) {
        currentConversation.messages.push(userMessage);
        currentConversation.messages.push(assistantMessage);
        localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
      }

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
          <h1 className="text-xl font-semibold">AI Voice Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <AudioVisualizer isActive={isSpeaking} />
          
          {/* Dashboard Button */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onDashboard}
            className="rounded-full"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Dashboard</span>
          </Button>
          
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

      {/* Voice Input Button Only */}
      <div className="p-4 border-t">
        <div className="max-w-3xl mx-auto flex justify-center">
          <Button
            size="lg"
            onClick={handleVoiceToggle}
            disabled={isProcessing || isSpeaking}
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
