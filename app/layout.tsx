import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from './providers';
import { Suspense } from 'react';

// Load fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: "OpenSVM - AI Explorer and RPC nodes provider for all SVM networks (Solana Virtual Machine)",
  description: "Explore all SVM networks with AI assistance, or create your Solana Network Extension for free.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
    other: {
      rel: 'icon',
      url: '/favicon.svg',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        {/* Preconnect to critical domains */}
        <link
          rel="preconnect"
          href="https://api.mainnet-beta.solana.com"
          crossOrigin="anonymous"
        />
        
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="/fonts/BerkeleyMono-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          href="/fonts/BerkeleyMono-Bold.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        
        {/* Priority hints for critical resources */}
        <link
          rel="preload"
          href="/favicon.svg"
          as="image"
          type="image/svg+xml"
        />
        
        {/* Meta tags for performance monitoring */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        
        {/* Base favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* Navbar can be deferred */}
          <Suspense fallback={null}>
            <Navbar>
              {/* Prioritize main content */}
              {children}
            </Navbar>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
