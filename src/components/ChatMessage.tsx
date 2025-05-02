
import { ChatMessage } from "@/services/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: MessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
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
          isUser
            ? "bg-assistant-primary text-white rounded-tr-none"
            : "bg-secondary dark:bg-muted rounded-tl-none"
        )}
      >
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
