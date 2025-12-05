import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="rounded-lg border border-gray-800 bg-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">General</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Settings will be available in future versions.</p>
            </div>
          </div>

          {/* Download Settings */}
          <div className="rounded-lg border border-gray-800 bg-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Download Preferences</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Configure default quality, download location, and more.</p>
            </div>
          </div>

          {/* About */}
          <div className="rounded-lg border border-gray-800 bg-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">About</h2>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-white">StreamFetch</strong> - Educational Media Downloader
              </p>
              <p className="text-muted-foreground">Version 1.0.0</p>
              <p className="text-muted-foreground">
                Built with Next.js 16, TypeScript, and Tailwind CSS
              </p>
            </div>
          </div>

          {/**
           * EDUCATIONAL NOTE: Settings Ideas
           *
           * Possible settings to implement:
           * - Default video quality preference
           * - Auto-download vs manual confirmation
           * - Download naming convention
           * - Concurrent download limit
           * - Network bandwidth throttling
           * - Notification preferences
           */}
          <div className="rounded-lg border border-gray-800 bg-card/30 p-6">
            <h3 className="text-sm font-semibold text-primary mb-2">
              ⚙️ Potential Settings
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Default quality selection (1080p, 720p, etc.)</li>
              <li>Automatic vs manual download confirmation</li>
              <li>File naming conventions</li>
              <li>Maximum concurrent downloads</li>
              <li>Bandwidth throttling options</li>
              <li>Notification settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
