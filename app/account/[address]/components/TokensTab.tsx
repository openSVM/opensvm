"use client";

interface Props {
  address: string;
  tokenBalances: { mint: string; balance: number; }[];
}

export default function TokensTab({ address, tokenBalances }: Props) {
  return (
    <div className="mt-4">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Token</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {tokenBalances.map((token, index) => (
            <tr key={token.mint}>
              <td className="text-left">{token.mint}</td>
              <td className="text-right">{token.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
