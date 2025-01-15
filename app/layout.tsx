import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "OpenSVM - Solana Virtual Machine Explorer",
  description: "Explore the Solana blockchain with AI assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="theme-cyberpunk" suppressHydrationWarning>
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
