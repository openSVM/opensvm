'use client';

import { DetailedTransactionInfo, InstructionWithAccounts } from '@/lib/solana';
import { useState } from 'react';
import AccountLink from './AccountLink';
import JsonTree from './JsonTree';
import { Tooltip } from './ui/tooltip';

interface TransactionNodeDetailsProps {
  tx: DetailedTransactionInfo;
}

export default function TransactionNodeDetails({ tx }: TransactionNodeDetailsProps) {
  const [selectedInstruction, setSelectedInstruction] = useState<number>(0);

  if (!tx.details) return null;

  const instruction = tx.details.instructions[selectedInstruction] as InstructionWithAccounts;
  if (!instruction) return null;

  // Process program ID once
  const programId = String('parsed' in instruction ? instruction.program : instruction.programId);

  // Calculate CU efficiency
  const cuEfficiency = instruction.computeUnitsConsumed 
    ? Math.round((instruction.computeUnitsConsumed / instruction.computeUnits) * 100)
    : null;

  // Calculate potential CU savings
  const cuSavings = instruction.computeUnits && instruction.computeUnitsConsumed
    ? instruction.computeUnits - instruction.computeUnitsConsumed
    : null;

  // Parse instruction data if it's a string, otherwise use it as is
  const parseInstructionData = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    return data;
  };

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
          <AccountLink 
            address={programId}
            className="font-mono text-sm break-all text-neutral-400 hover:text-neutral-200 transition-colors"
          />
        </div>
      </div>

      {/* Account List */}
      <div>
        <h3 className="text-lg font-medium mb-2">Accounts</h3>
        <div className="space-y-2">
          {instruction.accounts.map((accountIndex: number, i: number) => {
            const account = tx.details.accounts[accountIndex];
            const address = account.pubkey.toString();
            return (
              <div key={i} className="bg-neutral-900 rounded p-3">
                <div className="flex justify-between items-start">
                  <AccountLink 
                    address={address}
                    className="font-mono text-sm break-all text-neutral-400 hover:text-neutral-200 transition-colors"
                  />
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

      {/* Compute Units */}
      {(instruction.computeUnits || instruction.computeUnitsConsumed) && (
        <div>
          <h3 className="text-lg font-medium mb-2">Compute Units</h3>
          <div className="bg-neutral-900 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-400">Allocated</span>
              <span>{instruction.computeUnits?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-400">Consumed</span>
              <span>{instruction.computeUnitsConsumed?.toLocaleString()}</span>
            </div>
            {cuEfficiency !== null && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-400">Efficiency</span>
                <Tooltip content="Lower efficiency means higher potential for CU optimization">
                  <span className={`${
                    cuEfficiency < 50 ? 'text-red-400' :
                    cuEfficiency < 75 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {cuEfficiency}%
                  </span>
                </Tooltip>
              </div>
            )}
            {cuSavings && cuSavings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Potential Savings</span>
                <Tooltip content="CUs that could be saved with optimization">
                  <span className="text-blue-400">{cuSavings.toLocaleString()} CU</span>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data */}
      {instruction.data && (
        <div>
          <h3 className="text-lg font-medium mb-2">Instruction Data</h3>
          <div className="bg-neutral-900 rounded p-3">
            <JsonTree 
              data={parseInstructionData(instruction.data)}
              expandAll={false}
            />
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
                      String('parsed' in ix ? ix.program : ix.programId)
                    ))).map((id, idx, arr) => (
                      <span key={id}>
                        <AccountLink 
                          address={id}
                          className="hover:text-neutral-300 transition-colors"
                        >
                          {`${id.slice(0, 4)}...${id.slice(-4)}`}
                        </AccountLink>
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
