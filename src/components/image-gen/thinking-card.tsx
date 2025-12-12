"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Send, Search, Brain, ImageIcon, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { LoadingDots } from "./loading-dots";

export type ThinkingStatus = "pending" | "connecting" | "thinking" | "generating" | "complete";

interface ThinkingStep {
  id: string;
  text: string;
  timestamp: Date;
}

interface ThinkingCardProps {
  status: ThinkingStatus;
  steps: ThinkingStep[];
  isExpanded?: boolean;
  onToggle?: () => void;
}

const statusConfig: Record<ThinkingStatus, { icon: typeof Brain; label: string; color: string }> = {
  pending: { icon: Send, label: "Sending prompt", color: "text-muted-foreground" },
  connecting: { icon: Search, label: "Analyzing prompt", color: "text-blue-400" },
  thinking: { icon: Brain, label: "AI is thinking", color: "text-purple-400" },
  generating: { icon: ImageIcon, label: "Generating image", color: "text-primary" },
  complete: { icon: CheckCircle, label: "Complete", color: "text-green-400" },
};

export function ThinkingCard({ status, steps, isExpanded = false, onToggle }: ThinkingCardProps) {
  const [manualExpanded, setManualExpanded] = useState(isExpanded);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-expand when we have thoughts, allow manual toggle when complete
  const hasThoughts = steps.length > 0 && steps.some(s => s.text.length > 0);
  const expanded = status === "complete" ? manualExpanded : hasThoughts;

  const config = statusConfig[status];
  const Icon = config.icon;

  // Get the latest thought text
  const latestThought = steps.length > 0 ? steps[steps.length - 1].text : "";

  // Auto-scroll to bottom when new content arrives (unless user scrolled up)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && !userScrolledUp && status !== "complete") {
      container.scrollTop = container.scrollHeight;
    }
  }, [latestThought, userScrolledUp, status]);

  // Reset scroll lock when status changes to a new generation
  useEffect(() => {
    if (status === "pending" || status === "connecting") {
      setUserScrolledUp(false);
    }
  }, [status]);

  // Detect if user scrolled up
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 20;
    setUserScrolledUp(!isAtBottom);
  }, []);

  const handleToggle = () => {
    if (status === "complete") {
      setManualExpanded(!manualExpanded);
      onToggle?.();
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-1 overflow-hidden max-w-2xl">
      {/* Status Header - Always visible */}
      <button
        onClick={handleToggle}
        disabled={status !== "complete"}
        className={`w-full flex items-center justify-between p-4 transition-colors ${
          status === "complete" ? "hover:bg-surface-2 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className={`text-base font-medium ${config.color}`}>
            {config.label}
          </span>
          {status !== "complete" && (
            <LoadingDots size="md" className={config.color} />
          )}
        </div>
        {hasThoughts && (
          expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )
        )}
      </button>

      {/* Thought Content - Only shows when there's actual thinking text */}
      {expanded && latestThought && (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="border-t border-border px-4 py-3 max-h-64 overflow-y-auto scrollbar-thin bg-surface-2/50"
        >
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-3 [&_pre]:p-3 [&_pre]:rounded-lg">
            <ReactMarkdown>{latestThought}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
