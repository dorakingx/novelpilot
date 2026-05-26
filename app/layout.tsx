import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Lora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const siteDescription =
  "One prompt. Nine AI-powered agents. A complete story pipeline.";

export const metadata: Metadata = {
  title: "NovelPilot",
  description: siteDescription,
  openGraph: {
    title: "NovelPilot",
    description: siteDescription,
    type: "website",
    url: "https://novelpilot.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "NovelPilot",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col studio-backdrop subtle-grid-bg text-foreground">
        {children}
      </body>
    </html>
  );
}
