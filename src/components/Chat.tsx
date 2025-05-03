
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff } from "lucide-react";
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
  const userEmail = userData?.email || "";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [conversationId, setConversationId] = useState<number>(Date.now());
  const [hasSpokenInitialGreeting, setHasSpokenInitialGreeting] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  
  // Function to speak a message
  const speakMessage = async (message: string) => {
    try {
      setIsSpeaking(true);
      const audioData = await apiService.generateSpeech(message);
      
      // Create audio blob and play it
      const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      return true;
    } catch (error) {
      console.error("Error speaking message:", error);
      toast.error("Could not play the audio message. Please check your API keys.");
      setIsSpeaking(false);
      return false;
    }
  };

  // Process the message queue
  const processMessageQueue = async () => {
    if (messageQueue.length > 0 && !isSpeaking) {
      const nextMessage = messageQueue[0];
      const newQueue = messageQueue.slice(1);
      setMessageQueue(newQueue);
      
      await speakMessage(nextMessage);
    }
  };

  // Check for previous conversations with this user and prepare welcome message
  useEffect(() => {
    const loadPreviousConversation = async () => {
      // Create a base greeting
      let greeting = `Hello ${userName}! I'm your AI Voice Assistant.`;
      
      const history = JSON.parse(localStorage.getItem("conversation_history") || "[]");
      
      // Find the most recent conversation for this user
      for (let i = history.length - 1; i >= 0; i--) {
        const conv = history[i];
        if (conv.messages && conv.messages.some((msg: any) => 
          msg.role === "assistant" && 
          msg.content && 
          msg.content.includes(`Hello ${userName}!`)
        )) {
          // Extract topics from the last few user messages
          const userMessages = conv.messages
            .filter((msg: any) => msg.role === "user")
            .slice(-3); // Get the last 3 user messages
            
          if (userMessages.length > 0) {
            // Get topics from previous conversations
            const topics = userMessages.map((msg: any) => {
              const content = msg.content.toLowerCase();
              if (content.includes("weather")) return "the weather forecast";
              if (content.includes("calendar")) return "your calendar";
              if (content.includes("email") || content.includes("send")) return "sending information to your email";
              if (content.includes("renewable energy")) return "renewable energy developments";
              if (content.includes("time management")) return "time management techniques";
              if (content.includes("meeting") || content.includes("book")) return "booking a meeting";
              return "various topics";
            });
            
            // Get unique topics
            const uniqueTopics = Array.from(new Set(topics));
            if (uniqueTopics.length > 0) {
              greeting += ` I remember our previous conversation about ${uniqueTopics.join(" and ")}. Would you like to continue that conversation?`;
            }
          }
          break;
        }
      }
      
      // If no previous conversation was found or no topics extracted, use the basic greeting
      if (!greeting.includes("remember")) {
        greeting += " How can I help you today?";
      }
      
      // Set initial message
      const initialMessage: ChatMessage = {
        role: "assistant",
        content: greeting,
        timestamp: Date.now(),
      };
      
      setMessages([initialMessage]);
      
      // Add greeting to message queue for speech
      setMessageQueue([greeting]);
      
      // Store this conversation in history
      const conversationHistory = JSON.parse(localStorage.getItem("conversation_history") || "[]");
      const newConversation = {
        id: conversationId,
        date: new Date().toISOString(),
        messages: [initialMessage]
      };
      conversationHistory.push(newConversation);
      localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
      
      // Increment conversation counter
      const totalConversations = localStorage.getItem("total_conversations") || "0";
      localStorage.setItem("total_conversations", (parseInt(totalConversations) + 1).toString());
    };
    
    loadPreviousConversation();
  }, [userName, conversationId]);

  // Process message queue
  useEffect(() => {
    processMessageQueue();
  }, [messageQueue, isSpeaking]);

  // Scroll to bottom when messages change
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
    const currentConversation = conversationHistory.find((conv: any) => conv.id === conversationId);
    if (currentConversation) {
      currentConversation.messages = messages;
      localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
    }
    
    // Clear message queue
    setMessageQueue([]);
    
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
      const transcription = await apiService.transcribeAudio(audioBlob);
      
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
      // Create a system message that includes user context
      const systemMessage: ChatMessage = {
        role: "system",
        content: `You are an AI Voice Assistant talking to ${userName} (email: ${userEmail}). 
        If the user asks for documents or information that can be emailed, you should tell them 
        you'll email it to their provided email address (${userEmail}). 
        You can handle multiple requests at once. Keep answers concise for voice interface.`,
        timestamp: Date.now()
      };
      
      // Generate text response from OpenAI
      const assistantResponse = await apiService.generateTextResponse([
        systemMessage,
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
      const currentConversation = conversationHistory.find((conv: any) => conv.id === conversationId);
      if (currentConversation) {
        currentConversation.messages.push(userMessage);
        currentConversation.messages.push(assistantMessage);
        localStorage.setItem("conversation_history", JSON.stringify(conversationHistory));
      }

      // Add assistant response to message queue
      setMessageQueue(prev => [...prev, assistantResponse]);
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
