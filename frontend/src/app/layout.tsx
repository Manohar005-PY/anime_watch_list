import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "KAGE — A Cinematic Personal Anime Library",
  description:
    "An editorial, tactile personal anime collection manager with strictly isolated ownership, progress tracking, and authentic statistics.",
  keywords: ["anime", "watchlist", "manga", "cinema", "tracking", "library"],
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="cinematic-grain min-h-screen bg-kage-bg text-kage-text-primary antialiased selection:bg-white selection:text-black">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
