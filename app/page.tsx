import { Suspense } from 'react';
import HomeHero from '@/app/components/HomeHero';
import HomeSearch from '@/app/components/HomeSearch';
import HomeStats from '@/app/components/HomeStats';

// Static loading component
function LoadingStats() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-lg"></div>
      <div className="h-48 bg-muted rounded-lg"></div>
      <div className="h-64 bg-muted rounded-lg"></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative">
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section - Optimized for LCP */}
          <HomeHero />

          {/* Search - Client Component */}
          <Suspense>
            <HomeSearch />
          </Suspense>

          {/* Stats Section - Client Component with Loading State */}
          <Suspense fallback={<LoadingStats />}>
            <HomeStats />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
