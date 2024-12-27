'use client';

import { useParams } from 'next/navigation';

export default function BlockPage() {
  const params = useParams();
  const slot = params?.slot as string;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Block Details</h1>
      <div className="grid gap-6">
        <p className="text-gray-400">Loading block {slot}...</p>
      </div>
    </div>
  );
} 