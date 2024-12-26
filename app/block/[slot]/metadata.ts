import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { slot: string };
}): Promise<Metadata> {
  return {
    title: `Block #${params.slot} | OPENSVM`,
    description: `View details of Solana block #${params.slot} on OPENSVM`,
  };
} 