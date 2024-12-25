"use client";

import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";

const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=2eb1ae21-40d0-4b6d-adde-ccb3d56ad570";

export default function SolanaExplorer() {
  const [supplyStats, setSupplyStats] = useState<{
    circulating: number;
    nonCirculating: number;
  } | null>(null);
  const [networkStats, setNetworkStats] = useState<{
    tps: number;
    blockHeight: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<Array<{
    signature: string;
    timestamp: string;
    block: number;
    type: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connection = new Connection(HELIUS_RPC);
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        // Fetch supply stats
        const supply = await connection.getSupply();
        setSupplyStats({
          circulating: supply.value.circulating / 1e9,
          nonCirculating: supply.value.nonCirculating / 1e9,
        });

        // Fetch network stats
        const [slot, performance] = await Promise.all([
          connection.getSlot(),
          connection.getRecentPerformanceSamples(1),
        ]);
        
        setNetworkStats({
          tps: Math.round(performance[0]?.numTransactions / performance[0]?.samplePeriodSecs || 0),
          blockHeight: slot,
        });

        // Fetch recent transactions
        const signatures = await connection.getSignaturesForAddress(
          connection.getParsedProgramAccounts.address,
          { limit: 5 }
        );

        const txData = signatures.map(sig => ({
          signature: sig.signature,
          timestamp: new Date(sig.blockTime! * 1000).toLocaleString(),
          block: sig.slot,
          type: sig.memo || "Transaction",
        }));

        setTransactions(txData);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch blockchain data. Retrying...");
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">SOL Supply Stats</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>Circulating Supply: {supplyStats?.circulating.toFixed(2)} SOL</p>
            <p>Non-circulating Supply: {supplyStats?.nonCirculating.toFixed(2)} SOL</p>
          </>
        )}
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Network Stats</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <p>Current TPS: {networkStats?.tps}</p>
            <p>Block Height: {networkStats?.blockHeight}</p>
          </>
        )}
      </div>

      <div className="p-4 bg-white rounded-lg shadow col-span-full">
        <h2 className="text-lg font-semibold mb-4">Latest Transactions</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Signature</th>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Block</th>
                  <th className="px-4 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{tx.signature}</td>
                    <td className="border px-4 py-2">{tx.timestamp}</td>
                    <td className="border px-4 py-2">{tx.block}</td>
                    <td className="border px-4 py-2">{tx.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
