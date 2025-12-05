import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/footer";
import { Download, Languages, Film } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Landing Navbar */}
      <Navbar variant="landing" />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section id="features" className="w-full border-b bg-background py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need for Video Workflow
            </h2>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              Three powerful tools integrated into one seamless platform. Download, translate, and edit videos with professional-grade features.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Download}
              title="YouTube Downloader"
              description="Download videos from YouTube in the highest quality available. Choose from multiple formats and resolutions."
              features={[
                "Multiple quality options (1080p, 720p, 480p)",
                "Fast streaming downloads",
                "Video and audio formats",
                "No file size limits",
              ]}
              href="/youtube"
              gradient="from-blue-500 to-blue-600"
            />

            <FeatureCard
              icon={Languages}
              title="AI Dubbing"
              description="Translate and dub your videos into 50+ languages using advanced AI technology powered by ElevenLabs."
              features={[
                "50+ target languages",
                "Natural voice synthesis",
                "Automatic speaker detection",
                "Fast processing times",
              ]}
              href="/dubbing"
              gradient="from-purple-500 to-purple-600"
            />

            <FeatureCard
              icon={Film}
              title="Video Studio"
              description="Professional video editor with timeline editing, text overlays, effects, and multi-format export."
              features={[
                "Timeline-based editing",
                "Text and effects overlays",
                "Multiple export formats",
                "Cloud project storage",
              ]}
              href="/studio"
              gradient="from-pink-500 to-pink-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full border-b bg-muted/20 py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold">Download</h3>
              <p className="text-muted-foreground">
                Paste a YouTube URL and download the video in your preferred quality. Fast and reliable streaming downloads.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold">Translate</h3>
              <p className="text-muted-foreground">
                Use AI dubbing to translate your video into any of 50+ languages with natural-sounding voices.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 text-xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-bold">Edit</h3>
              <p className="text-muted-foreground">
                Polish your content with our professional video editor. Add text, effects, trim clips, and export in any format.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-[700px] text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of creators using StreamFetch for their video workflow.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Start Free
              </a>
              <a
                href="#features"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
