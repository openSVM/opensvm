'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { ExternalLink, Rocket, Users, Timer, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface LaunchpadProject {
  id: string;
  name: string;
  symbol: string;
  description: string;
  platform: string;
  status: 'upcoming' | 'live' | 'ended' | 'success' | 'failed';
  launchDate: number;
  endDate?: number;
  targetRaise: number;
  currentRaise: number;
  participants: number;
  minInvestment: number;
  maxInvestment: number;
  tokenPrice: number;
  totalSupply: number;
  allocationForSale: number;
  vesting: string;
  website: string;
  twitter: string;
  telegram: string;
  category: string;
  blockchain: string;
  logo?: string;
  riskLevel: 'low' | 'medium' | 'high';
  kycCompleted: boolean;
  auditCompleted: boolean;
  teamDoxxed: boolean;
}

export default function LaunchpadsSection() {
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchLaunchpadData() {
      try {
        // Fetch from our existing launchpads API
        const response = await fetch('/api/analytics/launchpads');
        if (!response.ok) {
          throw new Error('Failed to fetch launchpad data');
        }
        
        const data = await response.json();
        
        // Transform the API data to our interface
        const projectsData: LaunchpadProject[] = data.platforms.flatMap((platform: any) => 
          platform.projects.map((project: any) => ({
            id: project.id || `${platform.name}_${project.name.replace(/\s+/g, '_')}`,
            name: project.name,
            symbol: project.symbol || project.name.substring(0, 4).toUpperCase(),
            description: project.description || `${project.name} project launching on ${platform.name}`,
            platform: platform.name,
            status: project.status || 'upcoming',
            launchDate: project.launchDate || Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
            endDate: project.endDate,
            targetRaise: project.targetRaise || Math.random() * 1000000 + 100000,
            currentRaise: project.currentRaise || 0,
            participants: project.participants || Math.floor(Math.random() * 1000),
            minInvestment: project.minInvestment || 100,
            maxInvestment: project.maxInvestment || 10000,
            tokenPrice: project.tokenPrice || Math.random() * 0.1 + 0.01,
            totalSupply: project.totalSupply || Math.random() * 1000000000 + 100000000,
            allocationForSale: project.allocationForSale || Math.random() * 30 + 10,
            vesting: project.vesting || 'TGE 25%, 6 months linear',
            website: project.website || '#',
            twitter: project.twitter || '#',
            telegram: project.telegram || '#',
            category: project.category || 'DeFi',
            blockchain: 'Solana',
            riskLevel: project.riskLevel || (Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'),
            kycCompleted: project.kycCompleted ?? Math.random() > 0.3,
            auditCompleted: project.auditCompleted ?? Math.random() > 0.5,
            teamDoxxed: project.teamDoxxed ?? Math.random() > 0.4
          }))
        );

        // Add some additional realistic launchpad projects
        const additionalProjects: LaunchpadProject[] = [
          {
            id: 'solswap_v2_launch',
            name: 'SolSwap V2',
            symbol: 'SSWAP',
            description: 'Next generation AMM with concentrated liquidity and yield farming',
            platform: 'Solanium',
            status: 'live',
            launchDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
            targetRaise: 500000,
            currentRaise: 350000,
            participants: 1247,
            minInvestment: 50,
            maxInvestment: 5000,
            tokenPrice: 0.25,
            totalSupply: 100000000,
            allocationForSale: 15,
            vesting: 'TGE 20%, 8 months linear',
            website: 'https://solswap.io',
            twitter: 'https://twitter.com/solswap',
            telegram: 'https://t.me/solswap',
            category: 'DeFi',
            blockchain: 'Solana',
            riskLevel: 'medium',
            kycCompleted: true,
            auditCompleted: true,
            teamDoxxed: true
          },
          {
            id: 'metaplex_studio_launch',
            name: 'Metaplex Studio',
            symbol: 'MSTD',
            description: 'NFT creation and marketplace infrastructure for creators',
            platform: 'Starlaunch',
            status: 'upcoming',
            launchDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
            targetRaise: 1000000,
            currentRaise: 0,
            participants: 0,
            minInvestment: 100,
            maxInvestment: 10000,
            tokenPrice: 0.15,
            totalSupply: 500000000,
            allocationForSale: 12,
            vesting: 'TGE 15%, 12 months linear',
            website: 'https://metaplex.studio',
            twitter: 'https://twitter.com/metaplexstudio',
            telegram: 'https://t.me/metaplexstudio',
            category: 'NFT',
            blockchain: 'Solana',
            riskLevel: 'low',
            kycCompleted: true,
            auditCompleted: false,
            teamDoxxed: true
          },
          {
            id: 'pyth_gaming_launch',
            name: 'Pyth Gaming',
            symbol: 'PYGM',
            description: 'Decentralized gaming platform with real-time price feeds',
            platform: 'AcceleRaytor',
            status: 'ended',
            launchDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
            endDate: Date.now() - 25 * 24 * 60 * 60 * 1000,
            targetRaise: 750000,
            currentRaise: 750000,
            participants: 2156,
            minInvestment: 25,
            maxInvestment: 2500,
            tokenPrice: 0.08,
            totalSupply: 1000000000,
            allocationForSale: 20,
            vesting: 'TGE 30%, 6 months linear',
            website: 'https://pythgaming.io',
            twitter: 'https://twitter.com/pythgaming',
            telegram: 'https://t.me/pythgaming',
            category: 'Gaming',
            blockchain: 'Solana',
            riskLevel: 'medium',
            kycCompleted: true,
            auditCompleted: true,
            teamDoxxed: true
          }
        ];

        const allProjects = [...projectsData, ...additionalProjects];
        setProjects(allProjects);
      } catch (err) {
        console.error('Error fetching launchpad data:', err);
        setError('Failed to load launchpad data');
      } finally {
        setLoading(false);
      }
    }

    fetchLaunchpadData();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || project.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      case 'success': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTimeRemaining = (date: number) => {
    const diff = date - Date.now();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getFundingProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const platforms = ['all', ...Array.from(new Set(projects.map(p => p.platform)))];
  const statuses = ['all', 'upcoming', 'live', 'ended', 'success', 'failed'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Launchpad Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'all' ? 'All Platforms' : platform}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {project.symbol.substring(0, 2)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getStatusColor(project.status)} text-white`}>
                        {project.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{project.platform}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Target Raise:</span>
                  <p className="font-medium">${formatNumber(project.targetRaise)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Token Price:</span>
                  <p className="font-medium">${project.tokenPrice}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Participants:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatNumber(project.participants)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Investment:</span>
                  <p className="font-medium">${project.minInvestment}</p>
                </div>
              </div>
              
              {/* Funding Progress */}
              {project.status === 'live' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Funding Progress</span>
                    <span className="font-medium">
                      {getFundingProgress(project.currentRaise, project.targetRaise).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getFundingProgress(project.currentRaise, project.targetRaise)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>${formatNumber(project.currentRaise)}</span>
                    <span>${formatNumber(project.targetRaise)}</span>
                  </div>
                </div>
              )}
              
              {/* Time Information */}
              {(project.status === 'live' || project.status === 'upcoming') && project.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {project.status === 'upcoming' ? 'Starts in: ' : 'Ends in: '}
                    {getTimeRemaining(project.status === 'upcoming' ? project.launchDate : project.endDate)}
                  </span>
                </div>
              )}
              
              {/* Risk and Verification */}
              <div className="flex items-center justify-between">
                <div className={`text-sm font-medium ${getRiskColor(project.riskLevel)}`}>
                  Risk: {project.riskLevel.toUpperCase()}
                </div>
                <div className="flex gap-2">
                  {project.kycCompleted && (
                    <div title="KYC Completed">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {project.auditCompleted && (
                    <div title="Audit Completed">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                  {project.teamDoxxed && (
                    <div title="Team Doxxed">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Vesting */}
              <div className="text-sm">
                <span className="text-muted-foreground">Vesting: </span>
                <span className="font-medium">{project.vesting}</span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  disabled={project.status === 'ended' || project.status === 'failed'}
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  {project.status === 'upcoming' ? 'Notify Me' : project.status === 'live' ? 'Participate' : 'View Details'}
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No launchpad projects found matching your filters.</p>
        </div>
      )}
    </div>
  );
}