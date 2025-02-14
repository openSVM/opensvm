import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from './providers';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <Providers>
          <Navbar>
            {children}
          </Navbar>
        </Providers>
      </body>
    </html>
  );
}
