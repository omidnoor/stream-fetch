"use client";

import { useState, useCallback } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptInput } from "@/components/image-gen/prompt-input";
import { ConversationArea } from "@/components/image-gen/conversation-area";
import { GenerationSettings } from "@/components/image-gen/generation-settings";
import { Message, GeneratedImage } from "@/components/image-gen/message-bubble";
import {
  AspectRatio,
  GeminiModel,
} from "@/lib/gemini-helper";

export default function ImageGenPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Settings state
  const [model, setModel] = useState<GeminiModel>("gemini-2.5-flash-image");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [numberOfImages, setNumberOfImages] = useState(1);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleGenerate = useCallback(async (prompt: string, referenceImages: string[] = []) => {
    setIsLoading(true);

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: prompt,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      timestamp: new Date(),
    };

    // Create assistant message (pending) - shows immediately
    const assistantId = generateId();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      status: "pending",
      thinkingSteps: [],
      images: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    // Update to connecting status
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, status: "connecting" as const }
          : m
      )
    );

    try {
      // Use streaming endpoint
      const response = await fetch("/api/image-gen/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let streamedText = "";
      let thoughtText = "";
      const images: GeneratedImage[] = [];
      let thoughtCounter = 1;
      let buffer = ""; // Buffer for incomplete SSE lines

      // Process SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append to buffer and split by newlines
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("[Frontend] Received chunk:", data.type, data);

              if (data.type === "thought" && data.text) {
                // AI's reasoning/thinking - show in thinking card
                thoughtText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          status: "thinking" as const,
                          thinkingSteps: [
                            ...(m.thinkingSteps || []).filter(s => !s.id.startsWith("thought-")),
                            { id: `thought-${thoughtCounter++}`, text: thoughtText, timestamp: new Date() },
                          ],
                        }
                      : m
                  )
                );
              } else if (data.type === "text" && data.text) {
                // Final text response
                streamedText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: streamedText,
                        }
                      : m
                  )
                );
              } else if (data.type === "image" && data.image) {
                console.log("[Frontend] Image received! mimeType:", data.image.mimeType, "base64 length:", data.image.base64?.length);
                images.push(data.image);
                // Update with image as it arrives
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          status: "generating" as const,
                          images: [...(m.images || []), data.image],
                        }
                      : m
                  )
                );
              } else if (data.type === "done") {
                // Mark as complete
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          status: "complete" as const,
                          content: streamedText || "Image generated successfully",
                        }
                      : m
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              // Skip malformed JSON lines
              if (line.trim() && !line.startsWith("data: ")) continue;
            }
          }
        }
      }
    } catch (err) {
      console.error("[Frontend] Generation error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Failed to generate image",
                status: "error" as const,
                error: err instanceof Error ? err.message : "Unknown error",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [model, aspectRatio]);

  const clearConversation = () => {
    setMessages([]);
    setSelectedImage(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Image Generation</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-surface-2 px-2 py-1 rounded">
              {model.includes("flash") ? "Flash" : "Pro"} • {aspectRatio}
            </span>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Conversation Area */}
        <ConversationArea
          messages={messages}
          onImageClick={setSelectedImage}
        />

        {/* Prompt Input */}
        <div className="p-4 border-t border-border bg-surface-1">
          <PromptInput
            onSubmit={handleGenerate}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Right Sidebar - Settings */}
      <div className="w-72 shrink-0 border-l border-border overflow-y-auto bg-background">
        <div className="p-4">
          <GenerationSettings
            model={model}
            aspectRatio={aspectRatio}
            numberOfImages={numberOfImages}
            onModelChange={setModel}
            onAspectRatioChange={setAspectRatio}
            onNumberOfImagesChange={setNumberOfImages}
          />
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`}
            alt="Generated"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
