import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://seenly.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Seenly — Show who you are, not just what's on your resume",
  description: "Seenly is a minimalist platform where professionals create a shareable profile centered around a single 60-second video.",
  openGraph: {
    title: "Seenly — Show who you are",
    description: "Seenly is a minimalist platform where professionals create a shareable profile centered around a 60-second introduction video.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seenly — Show who you are",
    description: "Create a beautiful professional profile around one 60-second introduction video.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-white selection:text-black">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
