import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "OpenSVM - Solana Virtual Machine Explorer",
  description: "Explore the Solana blockchain with AI assistance",
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
