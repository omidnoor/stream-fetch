"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ArrowRight, AlertCircle, List, Languages } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DubbingCard } from "@/components/dubbing/dubbing-card"

function DubbingPageInner() {
  const searchParams = useSearchParams()
  const urlParam = searchParams.get("url")

  const [url, setUrl] = useState("")
  const [showDubbingCard, setShowDubbingCard] = useState(false)

  // Pre-fill URL from query params
  useEffect(() => {
    if (urlParam) {
      setUrl(urlParam)
      setShowDubbingCard(true)
    }
  }, [urlParam])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setShowDubbingCard(true)
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">AI Dubbing</h1>
          <p className="text-muted-foreground">
            Translate and dub your videos into 50+ languages with AI-powered voice synthesis
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dubbing/jobs" className="gap-2">
            <List className="h-4 w-4" />
            View Jobs
          </Link>
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-1/10">
              <Languages className="h-5 w-5 text-feature-1" />
            </div>
            <h3 className="font-semibold">50+ Languages</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Support for major languages including Spanish, French, German, Japanese, and more
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-2/10">
              <svg className="h-5 w-5 text-feature-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="font-semibold">Natural Voices</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered voice synthesis that sounds natural and maintains emotional tone
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-feature-3/10">
              <svg className="h-5 w-5 text-feature-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold">Fast Processing</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your dubbed videos in minutes with our optimized processing pipeline
          </p>
        </div>
      </div>

      {/* Video URL Input */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Create Dubbing Job</h2>
          <p className="text-sm text-muted-foreground">
            Enter a video URL to start the dubbing process
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Paste video URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 pl-12 pr-32 text-base"
            />
            <Button
              type="submit"
              size="lg"
              className="absolute right-2 top-1/2 -translate-y-1/2 gap-2"
              disabled={!url.trim()}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Supports YouTube videos and direct video URLs
          </p>
        </form>
      </div>

      {/* Dubbing Card - Shows after URL is entered */}
      {showDubbingCard && url && (
        <DubbingCard videoUrl={url} />
      )}

      {/* How It Works */}
      {!showDubbingCard && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">How AI Dubbing Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Enter Video URL</h4>
                <p className="text-sm text-muted-foreground">
                  Paste the URL of the video you want to dub. We support YouTube and direct video links.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Select Languages</h4>
                <p className="text-sm text-muted-foreground">
                  Choose the source language (detected automatically) and target language for translation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">AI Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI transcribes, translates, and generates natural-sounding voices in your target language.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Download Dubbed Audio</h4>
                <p className="text-sm text-muted-foreground">
                  Once processing is complete, download your dubbed audio file and use it in your projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Info */}
      <div className="rounded-lg border border-info/50 bg-info/10 p-6">
        <h3 className="text-sm font-semibold text-info mb-2">Pricing Information</h3>
        <p className="text-sm text-muted-foreground">
          Dubbing costs are calculated based on video duration. You'll see a cost estimate before creating a job.
          Enable watermark option to reduce costs. Powered by ElevenLabs.
        </p>
      </div>
    </div>
  )
}

export default function DubbingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <DubbingPageInner />
    </Suspense>
  )
}
