"use client";

import { User, Sparkles, Download, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThinkingCard, ThinkingStatus } from "./thinking-card";

interface GeneratedImage {
  base64: string;
  mimeType: string;
}

interface ThinkingStep {
  id: string;
  text: string;
  timestamp: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: GeneratedImage[];
  referenceImages?: string[]; // User uploaded images
  status?: "pending" | "connecting" | "thinking" | "generating" | "complete" | "error";
  thinkingSteps?: ThinkingStep[];
  error?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  onImageClick?: (image: GeneratedImage) => void;
}

export function MessageBubble({ message, onImageClick }: MessageBubbleProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const isUser = message.role === "user";

  // Debug: log message state
  if (!isUser) {
    console.log("[MessageBubble] Assistant message:", {
      id: message.id,
      status: message.status,
      hasImages: !!message.images,
      imageCount: message.images?.length ?? 0,
      content: message.content?.slice(0, 50),
    });
  }

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `generated-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-gradient-to-br from-primary to-accent text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 space-y-2 ${isUser ? "items-end" : ""}`}>
        {/* User's reference images */}
        {isUser && message.referenceImages && message.referenceImages.length > 0 && (
          <div className={`flex gap-2 flex-wrap ${isUser ? "justify-end" : ""}`}>
            {message.referenceImages.map((img, idx) => (
              <img
                key={idx}
                src={`data:image/png;base64,${img}`}
                alt="Reference"
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        )}

        {/* Message text - only show for user or assistant with content */}
        {message.content && (
          <div
            className={`inline-block rounded-2xl px-4 py-2.5 max-w-[85%] ${
              isUser
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-surface-2 text-foreground"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Status/Thinking card - show immediately for assistant, stays visible through all states */}
        {!isUser && message.status && message.status !== "error" && (
          <ThinkingCard
            status={message.status as ThinkingStatus}
            steps={message.thinkingSteps || []}
            isExpanded={thinkingExpanded}
            onToggle={() => setThinkingExpanded(!thinkingExpanded)}
          />
        )}

        {/* Error state */}
        {!isUser && message.status === "error" && message.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 max-w-[85%]">
            <p className="text-sm text-destructive">{message.error}</p>
          </div>
        )}

        {/* Generated images */}
        {!isUser && message.images && message.images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {message.images.map((image, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  alt={`Generated ${idx + 1}`}
                  className="max-w-sm rounded-lg border border-border cursor-pointer hover:border-primary transition-colors"
                  onClick={() => onImageClick?.(image)}
                />
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => onImageClick?.(image)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-muted-foreground ${isUser ? "text-right" : ""}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export type { Message, GeneratedImage, ThinkingStep };
