import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Download, Languages, Film } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Badge */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="text-muted-foreground">
                Now with AI-powered dubbing
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Download, Dub, and Edit{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Videos with AI
                </span>
              </h1>
              <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                Your complete video workflow solution. Download from YouTube,
                translate with AI dubbing, and edit with professional tools. All
                in one place.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/dashboard">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">
                  Videos Downloaded
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">
                  Languages Supported
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Showcase */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-[600px]">
              {/* Main Card - Editor Preview */}
              <div className="relative rounded-2xl border bg-background p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    streamfetch.app
                  </span>
                </div>

                {/* Mock Editor Interface */}
                <div className="space-y-4">
                  {/* Video Preview Area */}
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <div className="rounded-full bg-background/90 p-6 shadow-lg">
                      <Film className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  {/* Timeline Mock */}
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg border bg-muted/50">
                      <div className="flex h-full items-center gap-2 px-3">
                        <div className="h-10 w-20 rounded bg-blue-500/20"></div>
                        <div className="h-10 w-32 rounded bg-purple-500/20"></div>
                        <div className="h-10 w-24 rounded bg-pink-500/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Feature Cards */}
              <div className="absolute -left-6 top-1/4 hidden rounded-lg border bg-background p-3 shadow-lg lg:block">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Download</div>
                    <div className="text-xs text-muted-foreground">
                      1080p Ready
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 top-1/3 hidden rounded-lg border bg-background p-3 shadow-lg lg:block">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <Languages className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">AI Dubbing</div>
                    <div className="text-xs text-muted-foreground">
                      50+ Languages
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 right-12 hidden rounded-lg border bg-background p-3 shadow-lg lg:block">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-pink-500/10 p-2">
                    <Film className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Edit</div>
                    <div className="text-xs text-muted-foreground">
                      Professional Tools
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl"></div>
      </div>
    </section>
  );
}
