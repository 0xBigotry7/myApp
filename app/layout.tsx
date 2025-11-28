import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";
import { ThemeProvider } from "@/components/ThemeProvider";

// Font configuration
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelAI - 旅行计划",
  description: "Plan and track your travel expenses with AI-powered tools | 使用AI工具计划和跟踪您的旅行费用",
  applicationName: "TravelAI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TravelAI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Viewport configuration (Next.js 15+ requires separate export)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Important for iPhone notch/safe areas
  themeColor: "#fafafa", // zinc-50
};

// Script to prevent flash of wrong theme - runs synchronously before any rendering
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme') || 'system';
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = theme === 'dark' || (theme === 'system' && systemDark);
      var root = document.documentElement;
      // Remove any existing theme classes first
      root.classList.remove('light', 'dark');
      root.classList.add(isDark ? 'dark' : 'light');
      // Set background color IMMEDIATELY on html to prevent any flash
      root.style.backgroundColor = isDark ? '#0a0a0a' : '#F5F5F7';
      root.style.colorScheme = isDark ? 'dark' : 'light';
    } catch (e) {}
  })()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansSC.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS prefetch for faster external resource loading */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme script - runs before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased bg-dot-pattern min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          {children}
          <PWAInstaller />
        </ThemeProvider>
      </body>
    </html>
  );
}
