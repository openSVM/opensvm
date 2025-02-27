import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Block Details | OPENSVM',
  description: 'View Solana block details on OPENSVM',
};

export default function BlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}