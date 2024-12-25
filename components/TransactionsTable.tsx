'use client';

interface Transaction {
  signature: string;
  timestamp: Date | null;
  status: string;
  fee: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions = [] }: TransactionsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[#666]">
                Signature
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#666]">
                Time
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#666]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#666]">
                Fee (SOL)
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, idx) => (
              <tr 
                key={transaction.signature}
                className={idx === 0 ? '' : 'border-t border-[#e9ecef]'}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className="text-sm text-blue-500 hover:underline">
                      {transaction.signature.slice(0, 8)}...{transaction.signature.slice(-8)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-[#666]">
                    {transaction.timestamp?.toLocaleString() || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${transaction.status === 'Success' ? 'text-[#22c55e]' : 'text-red-500'}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-[#666]">
                    {(transaction.fee / 1e9).toFixed(9)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 