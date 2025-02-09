'use client';

import { DetailedTransactionInfo, InstructionWithAccounts } from '@/lib/solana';
import { useState } from 'react';

interface TransactionNodeDetailsProps {
  tx: DetailedTransactionInfo;
}

export default function TransactionNodeDetails({ tx }: TransactionNodeDetailsProps) {
  const [selectedInstruction, setSelectedInstruction] = useState<number>(0);

  if (!tx.details) return null;

  const instruction = tx.details.instructions[selectedInstruction] as InstructionWithAccounts;
  if (!instruction) return null;

  return (
    <div className="space-y-6">
      {/* Instruction Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tx.details.instructions.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedInstruction(index)}
            className={`px-3 py-1 rounded text-sm ${
              selectedInstruction === index
                ? 'bg-neutral-700 text-white'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            IX {index}
          </button>
        ))}
      </div>

      {/* Program Info */}
      <div>
        <h3 className="text-lg font-medium mb-2">Program</h3>
        <div className="bg-neutral-900 rounded p-3">
          <div className="font-mono text-sm break-all text-neutral-400">
            {'parsed' in instruction ? instruction.program : instruction.programId.toString()}
          </div>
        </div>
      </div>

      {/* Account List */}
      <div>
        <h3 className="text-lg font-medium mb-2">Accounts</h3>
        <div className="space-y-2">
          {instruction.accounts.map((accountIndex: number, i: number) => {
            const account = tx.details.accounts[accountIndex];
            return (
              <div key={i} className="bg-neutral-900 rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="font-mono text-sm break-all text-neutral-400">
                    {account.pubkey.toString()}
                  </div>
                  <div className="flex gap-2">
                    {account.signer && (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-900 text-green-300">
                        Signer
                      </span>
                    )}
                    {account.writable && (
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-900 text-blue-300">
                        Writable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data */}
      {instruction.data && (
        <div>
          <h3 className="text-lg font-medium mb-2">Instruction Data</h3>
          <div className="bg-neutral-900 rounded p-3">
            <pre className="text-sm text-neutral-400 overflow-x-auto">
              {instruction.data}
            </pre>
          </div>
        </div>
      )}

      {/* Inner Instructions */}
      {tx.details.innerInstructions?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Inner Instructions</h3>
          <div className="space-y-2">
            {tx.details.innerInstructions
              .filter(inner => inner.index === selectedInstruction)
              .map((inner, i) => (
                <div key={i} className="bg-neutral-900 rounded p-3">
                  <div className="text-sm text-neutral-400">
                    {inner.instructions.length} instruction{inner.instructions.length !== 1 ? 's' : ''}
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    Programs: {Array.from(new Set(inner.instructions.map(ix => 
                      'parsed' in ix ? ix.program : ix.programId.toString()
                    ))).map(id => `${id.slice(0, 4)}...${id.slice(-4)}`).join(', ')}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
