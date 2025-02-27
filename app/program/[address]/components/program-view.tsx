"use client";

import { useState } from 'react';
import DisassemblyView from '../disassembly-view';
import JsonTree from '@/components/JsonTree';

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

interface ProgramViewProps {
  programData: ProgramData;
  serializedAccountInfo: SerializedAccountInfo;
}

export default function ProgramView({ programData, serializedAccountInfo }: ProgramViewProps) {
  const [activeTab, setActiveTab] = useState<'disassembly' | 'raw'>('disassembly');

  return (
    <div className="space-y-6">
      {/* Program Info */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Program Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Address</div>
            <div className="font-mono break-all">{programData.address}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Owner</div>
            <div className="font-mono break-all">{programData.owner}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Data Size</div>
            <div>{programData.dataSize.toLocaleString()} bytes</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Balance</div>
            <div>{(programData.lamports / 1e9).toLocaleString()} SOL</div>
          </div>
        </div>
      </div>

      {/* View Selection */}
      <div className="flex space-x-4 border-b border-border">
        <button
          onClick={() => setActiveTab('disassembly')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'disassembly'
              ? 'text-primary border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Disassembly
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 -mb-px ${
            activeTab === 'raw'
              ? 'text-primary border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Raw Data
        </button>
      </div>

      {/* Content */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {activeTab === 'disassembly' ? (
          <DisassemblyView 
            data={serializedAccountInfo.data} 
            address={programData.address}
          />
        ) : (
          <div className="p-4">
            <JsonTree data={serializedAccountInfo} />
          </div>
        )}
      </div>
    </div>
  );
}