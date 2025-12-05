import { Settings as SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="w-full space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Settings will be available in future versions.</p>
          </div>
        </div>

        {/* Download Settings */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Download Preferences</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Configure default quality, download location, and more.</p>
          </div>
        </div>

        {/* Dubbing Settings */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">AI Dubbing</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Configure ElevenLabs API key, default languages, and dubbing preferences.</p>
          </div>
        </div>

        {/* About */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">StreamFetch</strong> - Download, Dub, and Edit Videos with AI
            </p>
            <p className="text-muted-foreground">Version 1.0.0</p>
            <p className="text-muted-foreground">
              Built with Next.js 16, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-6">
          <h3 className="text-sm font-semibold mb-3">
            Potential Settings (Coming Soon)
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Default quality selection (1080p, 720p, etc.)</li>
            <li>Automatic vs manual download confirmation</li>
            <li>File naming conventions</li>
            <li>Maximum concurrent downloads</li>
            <li>Bandwidth throttling options</li>
            <li>Notification settings</li>
            <li>ElevenLabs API configuration</li>
            <li>Default dubbing language preferences</li>
            <li>Editor export settings</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
