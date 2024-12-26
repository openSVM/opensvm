import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OPENSVM",
  description: "Open Source Solana Virtual Machine Explorer",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  metadataBase: new URL("https://opensvm.com"),
  openGraph: {
    title: "OPENSVM",
    description: "Open Source Solana Virtual Machine Explorer",
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'OPENSVM - Open Source Solana Virtual Machine Explorer',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OPENSVM",
    description: "Open Source Solana Virtual Machine Explorer",
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
