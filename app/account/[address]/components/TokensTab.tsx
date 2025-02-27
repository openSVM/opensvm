"use client";

interface Props {
  solBalance: number;
  tokenBalances: { mint: string; balance: number; }[];
}

export default function TokensTab({ solBalance, tokenBalances }: Props) {
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
          <tr>
            <td className="text-left">SOL</td>
            <td className="text-right">{solBalance.toFixed(9)}</td>
          </tr>
          {tokenBalances.map((token) => (
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
