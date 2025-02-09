"use client";

import { NetworkCharts } from '@/components/NetworkCharts';
import { NetworksTable } from '@/components/NetworksTable';

export default function NetworksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Network Performance</h1>
      <NetworkCharts networkId="solana" isLive={true} />
      <div className="mt-8">
        <NetworksTable />
      </div>
    </div>
  );
}
