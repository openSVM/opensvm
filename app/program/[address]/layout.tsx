import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ address: string }>;
}

export default async function ProgramLayout({
  children,
  params,
}: LayoutProps) {
  await params; // Ensure params are resolved
  return children;
}
