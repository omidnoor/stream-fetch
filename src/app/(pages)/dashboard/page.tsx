import Link from "next/link"
import { Download, Languages, Film, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to StreamFetch. Choose a tool below to get started.
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* YouTube Downloader */}
        <Link href="/youtube">
          <div className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-feature-1/10 mb-4 group-hover:bg-feature-1/20 transition-colors">
              <Download className="h-6 w-6 text-feature-1" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              YouTube Downloader
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Download videos from YouTube in high quality. Multiple formats and resolutions available.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* AI Dubbing */}
        <Link href="/dubbing">
          <div className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-feature-2/10 mb-4 group-hover:bg-feature-2/20 transition-colors">
              <Languages className="h-6 w-6 text-feature-2" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              AI Dubbing
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Translate and dub videos into 50+ languages with AI-powered voice synthesis.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Video Studio */}
        <Link href="/studio">
          <div className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-feature-3/10 mb-4 group-hover:bg-feature-3/20 transition-colors">
              <Film className="h-6 w-6 text-feature-3" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              Video Studio
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Professional video editor with timeline editing, text overlays, and effects.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Automation */}
        <Link href="/automation">
          <div className="group rounded-lg border bg-card p-6 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              Automation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Automate your video workflow. Download, dub, and edit videos in one seamless process.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Start Guide */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Start Guide</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-feature-1" />
              Download Videos
            </h3>
            <p className="text-sm text-muted-foreground">
              Paste a YouTube URL in the YouTube Downloader to fetch video info and download in your preferred quality.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Languages className="h-4 w-4 text-feature-2" />
              Translate Content
            </h3>
            <p className="text-sm text-muted-foreground">
              Use AI Dubbing to translate your videos into 50+ languages with natural-sounding AI voices.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Film className="h-4 w-4 text-feature-3" />
              Edit Videos
            </h3>
            <p className="text-sm text-muted-foreground">
              Open Video Studio to edit videos with a timeline editor, add text overlays, and apply effects.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Automate Workflow
            </h3>
            <p className="text-sm text-muted-foreground">
              Run the full pipeline automatically: download a video, dub it to another language, and merge the results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
