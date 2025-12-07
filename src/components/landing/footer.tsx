import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold">StreamFetch</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Download, dub, and edit videos with AI-powered tools. Your
              complete video workflow solution.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/youtube"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  YouTube Downloader
                </Link>
              </li>
              <li>
                <Link
                  href="/dubbing"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  AI Dubbing
                </Link>
              </li>
              <li>
                <Link
                  href="/studio"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Video Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/youtubei.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  YouTube API Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} StreamFetch. Built with Next.js and YouTube InnerTube API.
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Educational project demonstrating video processing workflows. Respect YouTube&apos;s Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
