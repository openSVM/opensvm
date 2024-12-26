'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button } from 'rinlab';
import RecentBlocks from '@/components/RecentBlocks';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <RecentBlocks />
    </main>
  );
}
