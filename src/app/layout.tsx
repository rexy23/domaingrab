import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GDPRProvider from "@/components/GDPRProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DomainGrab - Premium Domain Intelligence & Analysis",
  description: "Discover perfect domains with AI-powered analysis. Get brandability scores, market insights, and GDPR-compliant domain intelligence for your next venture.",
  keywords: "domain names, domain analysis, brandability, AI domain search, domain intelligence, GDPR compliant",
  authors: [{ name: "DomainGrab Team" }],
  creator: "DomainGrab",
  publisher: "DomainGrab",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://domaingrab.com",
    siteName: "DomainGrab",
    title: "DomainGrab - Premium Domain Intelligence & Analysis",
    description: "Discover perfect domains with AI-powered analysis and GDPR-compliant intelligence.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DomainGrab - Premium Domain Intelligence",
    description: "AI-powered domain analysis with GDPR compliance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GDPRProvider>
          {children}
        </GDPRProvider>
      </body>
    </html>
  );
}
