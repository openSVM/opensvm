/**
 * User Profile Page
 * Displays user's public browsing history with fancy UI/UX
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { UserProfile, UserHistoryEntry } from '@/types/user-history';
import { validateWalletAddress } from '@/lib/user-history-utils';
import { UserHistoryDisplay } from '@/components/user-history/UserHistoryDisplay';
import { UserHistoryStats } from '@/components/user-history/UserHistoryStats';
import { UserActivityCalendar } from '@/components/user-history/UserActivityCalendar';
import { UserFollowersList } from '@/components/user-history/UserFollowersList';
import { UserHistoryExport } from '@/components/user-history/UserHistoryExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/lib/theme';
import { 
  User, 
  Activity, 
  BarChart3, 
  Download, 
  Calendar, 
  Eye, 
  Globe,
  Loader2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Heart,
  Users
} from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const rawWalletAddress = params?.walletAddress as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('history');
  const [validatedWalletAddress, setValidatedWalletAddress] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { theme } = useTheme();

  // Validate wallet address on mount
  useEffect(() => {
    if (rawWalletAddress) {
      const validated = validateWalletAddress(rawWalletAddress);
      if (!validated) {
        setError('Invalid wallet address format');
        setLoading(false);
        return;
      }
      setValidatedWalletAddress(validated);
    }
  }, [rawWalletAddress]);

  const handleFollowToggle = async () => {
    if (!validatedWalletAddress || socialLoading) return;
    
    try {
      setSocialLoading(true);
      const action = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch(`/api/user-social/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAddress: validatedWalletAddress })
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Update follower count in profile
        if (profile) {
          setProfile({
            ...profile,
            socialStats: {
              ...profile.socialStats,
              followers: profile.socialStats.followers + (isFollowing ? -1 : 1)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!validatedWalletAddress || socialLoading) return;
    
    try {
      setSocialLoading(true);
      const action = isLiked ? 'unlike' : 'like';
      
      const response = await fetch(`/api/user-social/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAddress: validatedWalletAddress })
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        // Update likes count in profile
        if (profile) {
          setProfile({
            ...profile,
            socialStats: {
              ...profile.socialStats,
              likes: profile.socialStats.likes + (isLiked ? -1 : 1)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setSocialLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async () => {
    if (!validatedWalletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching profile for:', validatedWalletAddress);
      const response = await fetch(`/api/user-profile/${validatedWalletAddress}`);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API error response:', errorData);
        throw new Error(`Failed to fetch user profile: ${response.status} ${errorData}`);
      }
      
      const data = await response.json();
      console.log('Profile data received:', data);
      
      if (!data.profile) {
        throw new Error('No profile data in response');
      }
      
      setProfile(data.profile);

      // Track profile view (increment view count)
      await fetch(`/api/user-social/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAddress: validatedWalletAddress })
      }).catch(error => {
        console.log('Profile view tracking failed:', error);
        // Don't fail the whole page load if view tracking fails
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [validatedWalletAddress]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading user profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
              <p className="text-destructive mb-2">Error loading profile</p>
              <p className="text-muted-foreground text-sm">{error}</p>
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No profile found</p>
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar} alt={profile.displayName || 'User avatar'} />
                  <AvatarFallback className="text-lg font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                    {profile.displayName?.[0] || formatWalletAddress(profile.walletAddress)[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.displayName || formatWalletAddress(profile.walletAddress)}
                    </h1>
                    {profile.isPublic && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <Globe className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {profile.walletAddress}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                {/* Social interaction buttons */}
                <Button
                  variant={isFollowing ? "default" : "outline"}
                  size="sm"
                  onClick={handleFollowToggle}
                  disabled={socialLoading}
                  className="gap-1"
                >
                  {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLikeToggle}
                  disabled={socialLoading}
                  className="gap-1"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Liked' : 'Like'}
                </Button>
                <UserHistoryExport profile={profile} />
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {profile.socialStats.profileViews} views
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                  <p className="text-2xl font-bold text-foreground">
                    {profile.stats.totalVisits.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                  <p className="text-2xl font-bold text-foreground">
                    {profile.socialStats.profileViews.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {profile.socialStats.followers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Likes</p>
                  <p className="text-2xl font-bold text-foreground">
                    {profile.socialStats.likes}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Days Active</p>
                  <p className="text-2xl font-bold text-foreground">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Feed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            <UserHistoryDisplay history={profile.history} />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <UserHistoryStats stats={profile.stats} />
            <UserActivityCalendar history={profile.history} />
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UserFollowersList walletAddress={validatedWalletAddress} type="followers" />
              <UserFollowersList walletAddress={validatedWalletAddress} type="following" />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Social Stats Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.socialStats.likes}</p>
                    <p className="text-sm text-muted-foreground">Total Likes</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{profile.socialStats.profileViews}</p>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.history.slice(0, 10).map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.pageTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()} • {entry.pageType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}