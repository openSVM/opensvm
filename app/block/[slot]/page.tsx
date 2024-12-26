import { Metadata } from 'next';
import BlockDetails from '@/components/BlockDetails';

interface PageProps {
  params: Promise<{ slot: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Block #${resolvedParams.slot} | OPENSVM`,
    description: `View details of Solana block #${resolvedParams.slot} on OPENSVM`,
  };
}

export default async function BlockPage({
  params,
}: PageProps) {
  const resolvedParams = await params;
  return <BlockDetails slot={resolvedParams.slot} />;
} 