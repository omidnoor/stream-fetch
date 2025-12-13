"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Download, Settings, Film, Mic2, FileText, Zap, ChevronLeft, ChevronRight, ImageIcon, AudioWaveform } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "YouTube", href: "/youtube", icon: Download },
  { name: "Dubbing", href: "/dubbing", icon: Mic2 },
  { name: "Text-to-Speech", href: "/tts", icon: AudioWaveform },
  { name: "Image Gen", href: "/image-gen", icon: ImageIcon },
  { name: "Studio", href: "/studio", icon: Film },
  { name: "Automation", href: "/automation", icon: Zap },
  { name: "PDF Editor", href: "/pdf", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn(
      "relative flex h-screen flex-col bg-surface-1 border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-16 lg:w-64"
    )}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gradient-start to-gradient-end text-white shadow-md hover:shadow-lg transition-shadow"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-border",
        collapsed ? "justify-center" : "justify-center lg:justify-start"
      )}>
        <Link href="/dashboard" className={cn(
          "flex items-center gap-3",
          collapsed ? "px-3" : "px-3 lg:px-6"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex-shrink-0">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <span className={cn(
            "text-xl font-semibold text-white transition-opacity",
            collapsed ? "hidden" : "hidden lg:block"
          )}>StreamFetch</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 py-4",
        collapsed ? "px-2" : "px-2 lg:px-3"
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "justify-center lg:justify-start",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-3/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(
                collapsed ? "hidden" : "hidden lg:block"
              )}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-border",
        collapsed ? "p-2" : "p-2 lg:p-4"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          collapsed ? "justify-center" : "justify-center lg:justify-start"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-sm font-medium text-muted-foreground flex-shrink-0">
            JD
          </div>
          <div className={cn(
            "flex-1 min-w-0",
            collapsed ? "hidden" : "hidden lg:block"
          )}>
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
