import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import OverviewSection from './components/OverviewSection';
import CoinsScreenerSection from './components/CoinsScreenerSection';
import MemecoinsScreenerSection from './components/MemecoinScreenerSection';
import LaunchpadsSection from './components/LaunchpadsSection';
import AMMsSection from './components/AMMsSection';
import CLOBsSection from './components/CLOBsSection';
import PerpetualsSection from './components/PerpetualsSection';
import OptionsSection from './components/OptionsSection';
import TGBotsSection from './components/TGBotsSection';

const categoryConfig = {
  'overview': {
    title: 'DeFi Overview',
    description: 'Comprehensive overview of DeFi ecosystem on Solana',
    component: OverviewSection
  },
  'coins-screener': {
    title: 'Coins Screener',
    description: 'Advanced token screening with real-time market data',
    component: CoinsScreenerSection
  },
  'memecoins-screener': {
    title: 'Memecoins Screener',
    description: 'Track memecoins that are yet to be bonded on major exchanges',
    component: MemecoinsScreenerSection
  },
  'launchpads': {
    title: 'Launchpads',
    description: 'Analytics for token launch platforms and IDO statistics',
    component: LaunchpadsSection
  },
  'amms': {
    title: 'AMMs',
    description: 'Automated Market Makers liquidity and volume analytics',
    component: AMMsSection
  },
  'clobs': {
    title: 'CLOBs',
    description: 'Central Limit Order Book exchanges and trading data',
    component: CLOBsSection
  },
  'perpetuals': {
    title: 'Perpetuals',
    description: 'Perpetual futures trading platforms and analytics',
    component: PerpetualsSection
  },
  'options': {
    title: 'Options',
    description: 'Options trading platforms and derivatives analytics',
    component: OptionsSection
  },
  'bots': {
    title: 'TG Bots & Other bots',
    description: 'Telegram and trading bot analytics and performance',
    component: TGBotsSection
  },
  'defai': {
    title: 'DeFAI',
    description: 'AI-powered DeFi tools and analytics platforms',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">DeFAI section coming soon...</p></div>
  },
  'aggregators': {
    title: 'Aggregators',
    description: 'DEX aggregators and swap optimization platforms',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Aggregators section coming soon...</p></div>
  },
  'yield-agg': {
    title: 'Yield Aggregators',
    description: 'Yield farming and optimization platform analytics',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Yield Aggregators section coming soon...</p></div>
  },
  'staking': {
    title: 'Staking',
    description: 'Staking pools, validators, and reward analytics',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Staking section coming soon...</p></div>
  },
  'stablecoins': {
    title: 'Stablecoins',
    description: 'Stablecoin analytics, peg stability, and market data',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Stablecoins section coming soon...</p></div>
  },
  'oracles': {
    title: 'Data Providers & Oracles',
    description: 'Oracle networks and data feed analytics',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Data Providers & Oracles section coming soon...</p></div>
  },
  'tools': {
    title: 'Tools',
    description: 'DeFi tools, utilities, and infrastructure platforms',
    component: () => <div className="text-center py-20"><p className="text-muted-foreground">Tools section coming soon...</p></div>
  }
};

interface PageProps {
  params: {
    category: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const config = categoryConfig[params.category as keyof typeof categoryConfig];
  
  if (!config) {
    return {
      title: 'DeFi Category Not Found',
      description: 'The requested DeFi category does not exist'
    };
  }

  return {
    title: `${config.title} | OpenSVM DeFi Analytics`,
    description: config.description,
    keywords: `defi, solana, analytics, ${params.category.replace('-', ' ')}`,
    openGraph: {
      title: config.title,
      description: config.description,
      type: 'website',
    },
  };
}

export default function DeFiCategoryPage({ params }: PageProps) {
  const config = categoryConfig[params.category as keyof typeof categoryConfig];
  
  if (!config) {
    notFound();
  }

  const ComponentToRender = config.component;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {config.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            {config.description}
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        }>
          <ComponentToRender />
        </Suspense>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(categoryConfig).map((category) => ({
    category,
  }));
}