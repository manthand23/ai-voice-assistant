import { ChatMessage } from "@/services/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Props interface for our message component
interface MessageProps {
  message: ChatMessage;
}


export function ChatMessageComponent({ message }: MessageProps) {
  // State for audio playback (to be implemented later)
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Quick check if this is a user message
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          // Different styling based on sender
          isUser
            ? "bg-assistant-primary text-white rounded-tr-none"
            : "bg-secondary dark:bg-muted rounded-tl-none"
        )}
      >
        {/* Render the message content */}
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
