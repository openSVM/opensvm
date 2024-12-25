import { formatDistance } from 'date-fns';

interface Transaction {
  signature: string;
  slot: number;
  timestamp: number;
  success: boolean;
  fee: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="mt-6">
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-medium text-gray-900">
              Transactions
            </h3>
            <div className="flex items-center space-x-2">
              <button className="rounded-md bg-gray-100 px-3 py-1.5 text-[13px] font-medium text-gray-900 hover:bg-gray-200">
                All
              </button>
              <button className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">
                Sol Transfer
              </button>
              <button className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">
                Token Transfer
              </button>
            </div>
          </div>

          <div className="mt-4 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th scope="col" className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-[13px] font-medium text-gray-500 sm:pl-6">
                        Signature
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-[13px] font-medium text-gray-500">
                        Block
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-[13px] font-medium text-gray-500">
                        Time
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-[13px] font-medium text-gray-500">
                        Result
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-[13px] font-medium text-gray-500">
                        Fee(SOL)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, idx) => (
                      <tr 
                        key={transaction.signature}
                        className={idx === 0 ? '' : 'border-t border-gray-100'}
                      >
                        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-[13px] text-blue-500 hover:underline sm:pl-6">
                          {transaction.signature.slice(0, 8)}...{transaction.signature.slice(-8)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[13px] text-gray-900">
                          {transaction.slot.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[13px] text-gray-500">
                          {new Date(transaction.timestamp * 1000).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${
                            transaction.success
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[13px] text-gray-500">
                          {transaction.fee?.toFixed(6) || '0.000000'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 