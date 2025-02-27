'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProgramContent = dynamic(() => import('./program-content'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

interface ProgramData {
  address: string;
  executable: boolean;
  owner: string;
  lamports: number;
  rentEpoch: number;
  data: number[];
  dataSize: number;
}

interface SerializedAccountInfo {
  executable: boolean;
  owner: string;
  lamports: string;
  rentEpoch: string;
  data: number[];
}

interface Props {
  programData: ProgramData;
  serializedAccountInfo: SerializedAccountInfo;
}

export default function ClientPage({ programData, serializedAccountInfo }: Props) {
  return (
    <div className="p-6 bg-background min-h-screen">
      <ProgramContent 
        programData={programData} 
        serializedAccountInfo={serializedAccountInfo}
      />
    </div>
  );
}