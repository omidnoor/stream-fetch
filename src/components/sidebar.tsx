"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Download, Settings, Film, Mic2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "YouTube", href: "/youtube", icon: Download },
  { name: "Dubbing", href: "/dubbing", icon: Mic2 },
  { name: "Studio", href: "/studio", icon: Film },
  { name: "PDF Editor", href: "/pdf", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-surface-1 border-r border-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        <span className="text-xl font-semibold text-white">StreamFetch</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Check if current path matches or is a subpath
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-3/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-sm font-medium text-muted-foreground">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
