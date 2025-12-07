import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/footer";
import { Download, Languages, Film, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Landing Navbar */}
      <Navbar variant="landing" />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section id="features" className="w-full border-b bg-background py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need for Video Workflow
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
              Three powerful tools integrated into one seamless platform. Download, translate, and edit videos with professional-grade features.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
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
              gradient="from-feature-1 to-feature-1"
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
              gradient="from-feature-2 to-feature-2"
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
              gradient="from-feature-3 to-feature-3"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full border-b bg-muted/20 py-20 md:py-28">
        <div className="container px-4 md:px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-bold">Download</h3>
              <p className="text-muted-foreground">
                Paste a YouTube URL and download the video in your preferred quality. Fast and reliable streaming downloads.
              </p>
              {/* Arrow connector - hidden on mobile */}
              <div className="absolute right-0 top-6 hidden translate-x-1/2 lg:block">
                <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-bold">Translate</h3>
              <p className="text-muted-foreground">
                Use AI dubbing to translate your video into any of 50+ languages with natural-sounding voices.
              </p>
              {/* Arrow connector - hidden on mobile and tablet */}
              <div className="absolute right-0 top-6 hidden translate-x-1/2 lg:block">
                <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
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
      <section className="w-full bg-gradient-to-br from-feature-1/10 via-feature-2/10 to-feature-3/10 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-base text-muted-foreground md:text-lg">
              Start downloading, dubbing, and editing your videos today.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-3">
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
