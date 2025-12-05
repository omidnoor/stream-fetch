import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFetch - Download, Dub, and Edit Videos with AI",
  description: "Your complete video workflow solution. Download from YouTube, translate with AI dubbing, and edit with professional tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
