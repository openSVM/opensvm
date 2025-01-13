'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import ProgramContentClient from './program-content-client';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-gray-400">Loading program data...</div>
      </div>
    </div>
  );
}

export default function Page() {
  const params = useParams();
  const address = params?.address as string;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <Suspense fallback={<LoadingSpinner />}>
          <ProgramContentClient address={address} />
        </Suspense>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
