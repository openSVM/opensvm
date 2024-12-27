'use client';

export default function AnalyticsPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Network statistics and metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">SOL Price</div>
            <div className="text-2xl font-bold">$198.35</div>
            <div className="text-[#00DC82] text-sm mt-1">+3.15%</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">Market Cap</div>
            <div className="text-2xl font-bold">$84.5B</div>
            <div className="text-[#00DC82] text-sm mt-1">+2.8%</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">24h Volume</div>
            <div className="text-2xl font-bold">$2.1B</div>
            <div className="text-red-500 text-sm mt-1">-5.2%</div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-sm text-muted-foreground mb-2">TPS</div>
            <div className="text-2xl font-bold">3,245</div>
            <div className="text-sm text-muted-foreground mt-1">Peak: 4,122</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h2 className="font-semibold">Transaction History</h2>
            </div>
            <div className="aspect-[2/1] flex items-center justify-center text-muted-foreground">
              Chart coming soon...
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="p-6 border-b">
              <h2 className="font-semibold">Network Stats</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Total Transactions</div>
                <div>251.2B</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Active Accounts</div>
                <div>8.1M</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Epoch</div>
                <div>432</div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">Slot</div>
                <div>225,184,291</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 