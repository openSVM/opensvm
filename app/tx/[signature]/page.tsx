import { DetailedTransactionInfo } from "@/lib/solana";
import TransactionNodeDetails from "@/components/TransactionNodeDetails";
import TransactionAnalysis from "@/components/TransactionAnalysis";
import EnhancedTransactionVisualizer from "@/components/EnhancedTransactionVisualizer";
import React from "react";

interface Props {
  params: {
    signature: string;
  };
}

async function getTransactionDetails(
  signature: string,
): Promise<DetailedTransactionInfo> {
  console.log(signature);

  const url = new URL(
    "/api/solana-proxy",
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  );
  url.searchParams.set("transaction", encodeURIComponent(signature));

  const res = await fetch(url, {
    cache: "no-store",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch transaction details");
  }

  return res.json();
}

export default async function TransactionPage({ params }: Props) {
  const { signature } = await Promise.resolve(params);
  const tx = await getTransactionDetails(signature);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel: Transaction Details */}
        <div className="space-y-6 lg:w-1/3">
          <div className="rounded-lg bg-neutral-900 p-4">
            <h2 className="text-lg font-semibold">Transaction Overview</h2>
            <div className="text-sm text-gray-400">
              Signature: {signature}
              <br />
              Status: {tx?.success ? "Success" : "Failed"}
            </div>
            <TransactionNodeDetails tx={tx} />
          </div>
          <div className="space-y-6 lg:w-2/3">
            <EnhancedTransactionVisualizer tx={tx} />
            <TransactionAnalysis tx={tx} />
          </div>
        </div>

        {/* Middle Panel: Visualizations */}
      </div>
    </div>
  );
}
