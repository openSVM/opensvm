import { Suspense } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeSearchQuery, formatNumber, isValidSolanaAddress } from '@/lib/utils';

interface SearchPageProps {
  searchParams: { q?: string };
  params: Record<string, string>;
}

async function searchAccounts(rawQuery: string) {
  const query = sanitizeSearchQuery(rawQuery);
  if (!query) return { error: 'Invalid search query' };
  
  // Validate if query looks like a Solana address
  if (query.length > 30 && !isValidSolanaAddress(query)) {
    return { error: 'Invalid Solana address format' };
  }
  try {
    const response = await fetch(`/api/search/accounts?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
  } catch (error) {
    console.error('Account search error:', error);
    return { error: 'Failed to search accounts' };
  }
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const query = sanitizeSearchQuery(searchParams?.q || '');
  
  let accountResults = null;
  let error = null;

  if (query) {
    try {
      accountResults = await searchAccounts(query);
    } catch (e) {
      error = 'Failed to perform search';
      console.error(e);
    }
  } else {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Please enter a search query</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Results for "{query}"</h1>
      
      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Loading Results</h2>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            }
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Accounts</h2>
                </CardHeader>
                <CardContent>
                  {accountResults?.error ? (
                    <p className="text-red-500">{accountResults.error}</p>
                  ) : accountResults?.length ? (
                    <div className="space-y-4">
                      {accountResults.map((account: any) => (
                        <div key={account.address} className="p-4 border rounded">
                          <p className="font-mono text-sm">{account.address}</p>
                          {account.balance && (
                            <p className="text-sm text-gray-500">Balance: {formatNumber(account.balance)} SOL</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No matching accounts found</p>
                  )}
                </CardContent>
              </Card>

              <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Tokens</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No matching tokens found</p>
                  </CardContent>
                </Card>
              </Suspense>

              <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Programs</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No matching programs found</p>
                  </CardContent>
                </Card>
              </Suspense>
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
}
