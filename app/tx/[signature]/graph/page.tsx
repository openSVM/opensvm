import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ signature: string }>;
}

// Redirect from /tx/[signature]/graph to /tx/[signature]
// since the graph is now integrated directly on the main transaction page
export default async function TransactionGraphPage({ params }: Props) {
  // Await the params in the server component
  const { signature } = await params;
  
  // Redirect to the main transaction page
  redirect(`/tx/${signature}`);
}