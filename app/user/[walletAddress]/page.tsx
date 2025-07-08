/**
 * User Profile Page
 * Displays user's public browsing history with fancy UI/UX
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UserProfile, UserHistoryEntry } from '@/types/user-history';
import { UserHistoryDisplay } from '@/components/user-history/UserHistoryDisplay';
import { UserHistoryStats } from '@/components/user-history/UserHistoryStats';
import { UserHistoryGraph } from '@/components/user-history/UserHistoryGraph';
import { UserHistoryExport } from '@/components/user-history/UserHistoryExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Activity, 
  BarChart3, 
  Download, 
  Calendar, 
  Eye, 
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const walletAddress = params?.walletAddress as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('history');

  const fetchUserProfile = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-profile/${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading user profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <p className="text-red-600 dark:text-red-400 mb-2">Error loading profile</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
              <Button 
                onClick={fetchUserProfile} 
                variant="outline" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">No profile found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={profile.avatar} alt={profile.displayName || 'User avatar'} />
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {profile.displayName?.[0] || formatWalletAddress(profile.walletAddress)[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.displayName || formatWalletAddress(profile.walletAddress)}
                    </h1>
                    {profile.isPublic && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {profile.walletAddress}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(profile.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      <span>Last active {formatDate(profile.lastActive)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserHistoryExport profile={profile} />
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {profile.stats.totalVisits} visits
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.totalVisits.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.uniquePages}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Most Visited</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {profile.stats.mostVisitedPageType}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.dailyActivity.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Graph
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <UserHistoryDisplay history={profile.history} />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <UserHistoryStats stats={profile.stats} />
          </TabsContent>
          
          <TabsContent value="graph" className="space-y-4">
            <UserHistoryGraph 
              history={profile.history}
              stats={profile.stats}
              walletAddress={profile.walletAddress}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}