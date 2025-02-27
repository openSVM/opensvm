
interface TransferAnalytics {
  totalVolume: number;
  totalTransactions: number;
  uniqueTokens: number;
  topTokens: {
    symbol: string;
    volume: number;
    count: number;
  }[];
  volumeByDay: {
    date: string;
    volume: number;
  }[];
  unusualActivity: {
    type: string;
    details: string;
    timestamp: string;
    signature: string;
  }[];
}

interface GroupedTransfer {
  signature: string;
  timestamp: string;
  transfers: any[];
  totalValue: number;
}

interface UnusualActivity {
  type: string;
  details: string;
  timestamp: string;
  signature: string;
}

function ensureString(value: string | undefined): string {
  return value || '';
}

function getDateString(timestamp: string | undefined): string {
  if (!timestamp) {
    return new Date().toISOString().split('T')[0]!;
  }
  try {
    return new Date(timestamp).toISOString().split('T')[0]!;
  } catch (error) {
    return new Date().toISOString().split('T')[0]!;
  }
}

export function groupTransfersByTx(transfers: any[]): any[] {
  const grouped = transfers.reduce((acc, transfer) => {
    if (!acc[transfer.signature]) {
      acc[transfer.signature] = {
        signature: transfer.signature,
        timestamp: ensureString(transfer.timestamp),
        transfers: [],
        totalValue: 0
      };
    }
    const group = acc[transfer.signature];
    if (group) {
      group.transfers.push(transfer);
      group.totalValue += transfer.usdValue || 0;
    }
    return acc;
  }, {} as Record<string, GroupedTransfer>);

  return Object.values(grouped).sort((a: any, b: any) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function analyzeTransfers(transfers: any[]): TransferAnalytics {
  const tokenMap = new Map<string, { volume: number; count: number }>();
  const dayVolumes = new Map<string, number>();
  const unusualActivity: UnusualActivity[] = [];

  // Calculate volumes and counts
  transfers.forEach(transfer => {
    // Ensure we have a valid symbol by using token as fallback
    const symbol = transfer.token;
    const value = transfer.usdValue || 0;
    const day = getDateString(transfer.timestamp);

    // Token stats
    if (!tokenMap.has(symbol)) {
      tokenMap.set(symbol, { volume: 0, count: 0 });
    }
    const tokenStats = tokenMap.get(symbol);
    if (tokenStats) {
      tokenStats.volume += value;
      tokenStats.count += 1;
    }

    // Daily volumes
    dayVolumes.set(day, (dayVolumes.get(day) || 0) + value);

    // Detect unusual activity
    if (value > 10000) { // Large transfers
      unusualActivity.push({
        type: 'Large Transfer',
        details: `${symbol} transfer worth $${value.toLocaleString()}`,
        timestamp: ensureString(transfer.timestamp),
        signature: transfer.signature
      });
    }
  });

  // Get top tokens by volume
  const topTokens = Array.from(tokenMap.entries())
    .map(([symbol, stats]) => ({
      symbol,
      volume: stats.volume,
      count: stats.count
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  // Get volume by day
  const volumeByDay = Array.from(dayVolumes.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalVolume: transfers.reduce((sum, t) => sum + (t.usdValue || 0), 0),
    totalTransactions: new Set(transfers.map(t => t.signature)).size,
    uniqueTokens: tokenMap.size,
    topTokens,
    volumeByDay,
    unusualActivity
  };
}

export function transfersToCSV(transfers: any[]): string {
  const headers = [
    'Timestamp',
    'Transaction ID',
    'From',
    'To',
    'Token',
    'Amount',
    'USD Value',
    'Current USD Value',
    'Type'
  ];

  const rows = transfers.map(t => [
    ensureString(t.timestamp),
    t.signature,
    t.from,
    t.to,
    t.token,
    t.amount.toString(),
    (t.usdValue || '').toString(),
    (t.currentUsdValue || '').toString(),
    t.type
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
