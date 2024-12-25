"use client";

import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";

// Sacred UI components
import { Card } from "@sacred/Card";
import { Grid } from "@sacred/Grid";
import { DataTable } from "@sacred/DataTable";
import { Text } from "@sacred/Text";

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
      <Card>
        <Text>{error}</Text>
      </Card>
    );
  }

  return (
    <Grid>
      <Card>
        <Text>SOL Supply Stats</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <Text>Circulating Supply: {supplyStats?.circulating.toFixed(2)} SOL</Text>
            <Text>Non-circulating Supply: {supplyStats?.nonCirculating.toFixed(2)} SOL</Text>
          </>
        )}
      </Card>

      <Card>
        <Text>Network Stats</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <Text>Current TPS: {networkStats?.tps}</Text>
            <Text>Block Height: {networkStats?.blockHeight}</Text>
          </>
        )}
      </Card>

      <Card>
        <Text>Latest Transactions</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <DataTable
            data={transactions}
            columns={[
              { header: "Signature", accessor: "signature" },
              { header: "Timestamp", accessor: "timestamp" },
              { header: "Block", accessor: "block" },
              { header: "Type", accessor: "type" },
            ]}
          />
        )}
      </Card>
    </Grid>
  );
}
