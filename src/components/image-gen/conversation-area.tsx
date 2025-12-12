"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { MessageBubble, Message, GeneratedImage } from "./message-bubble";
import { Sparkles } from "lucide-react";

interface ConversationAreaProps {
  messages: Message[];
  onImageClick?: (image: GeneratedImage) => void;
}

export function ConversationArea({ messages, onImageClick }: ConversationAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const lastScrollTop = useRef(0);

  // Detect if user scrolled up
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;

    // User scrolled up if they moved up and are not at bottom
    if (scrollTop < lastScrollTop.current && !isAtBottom) {
      setUserScrolled(true);
    }

    // User scrolled back to bottom
    if (isAtBottom) {
      setUserScrolled(false);
    }

    lastScrollTop.current = scrollTop;
  }, []);

  // Auto-scroll when new messages arrive (unless user scrolled up)
  useEffect(() => {
    if (!userScrolled && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, userScrolled]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Start creating</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Describe the image you want to generate, or upload a reference image to edit.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onImageClick={onImageClick}
        />
      ))}

      {/* Scroll indicator when user scrolled up */}
      {userScrolled && (
        <button
          onClick={() => {
            setUserScrolled(false);
            containerRef.current?.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg hover:bg-primary/90 transition-colors z-10"
        >
          ↓ New content
        </button>
      )}
    </div>
  );
}

export type { Message, GeneratedImage };
