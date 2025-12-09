import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFetch - Download, Dub, and Edit Videos with AI",
  description: "Your complete video workflow solution. Download from YouTube, translate with AI dubbing, and edit with professional tools.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
