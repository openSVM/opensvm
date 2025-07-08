/**
 * User History Display Component
 * Shows browsing history with fancy UI/UX
 */

'use client';

import { useState, useMemo } from 'react';
import { UserHistoryEntry } from '@/types/user-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Calendar, 
  ExternalLink, 
  Search, 
  Filter,
  Clock,
  MousePointer,
  FileText,
  Coins,
  Server,
  Code,
  BarChart3,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface UserHistoryDisplayProps {
  history: UserHistoryEntry[];
}

const pageTypeIcons = {
  transaction: FileText,
  account: MousePointer,
  block: Calendar,
  program: Code,
  token: Coins,
  validator: Server,
  analytics: BarChart3,
  search: Search,
  other: Globe
};

const pageTypeColors = {
  transaction: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  account: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  block: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  program: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  token: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  validator: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  analytics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  search: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
};

export function UserHistoryDisplay({ history }: UserHistoryDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPageType, setSelectedPageType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'pageType'>('timestamp');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.pageTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.metadata?.transactionId?.includes(searchTerm) ||
        entry.metadata?.accountAddress?.includes(searchTerm) ||
        entry.metadata?.searchQuery?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by page type
    if (selectedPageType !== 'all') {
      filtered = filtered.filter(entry => entry.pageType === selectedPageType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'timestamp') {
        return b.timestamp - a.timestamp;
      } else {
        return a.pageType.localeCompare(b.pageType);
      }
    });

    return filtered;
  }, [history, searchTerm, selectedPageType, sortBy]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 2592000000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No browsing history yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start exploring OpenSVM to see your browsing history here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Browsing History
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedPageType} onValueChange={setSelectedPageType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transaction">Transactions</SelectItem>
              <SelectItem value="account">Accounts</SelectItem>
              <SelectItem value="block">Blocks</SelectItem>
              <SelectItem value="program">Programs</SelectItem>
              <SelectItem value="token">Tokens</SelectItem>
              <SelectItem value="validator">Validators</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="search">Search</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: 'timestamp' | 'pageType') => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Latest First</SelectItem>
              <SelectItem value="pageType">Page Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {paginatedHistory.length} of {filteredHistory.length} results
          </span>
          <Badge variant="outline">
            {history.length} total visits
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-1">
          {paginatedHistory.map((entry, index) => {
            const Icon = pageTypeIcons[entry.pageType] || Globe;
            const colorClass = pageTypeColors[entry.pageType] || pageTypeColors.other;
            
            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link 
                      href={entry.path}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                    >
                      {entry.pageTitle}
                    </Link>
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Badge variant="outline" className="text-xs">
                      {entry.pageType}
                    </Badge>
                    <span className="font-mono text-xs truncate">
                      {entry.path}
                    </span>
                  </div>
                  
                  {entry.metadata?.searchQuery && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-500">
                      <Search className="h-3 w-3" />
                      <span>Search: "{entry.metadata.searchQuery}"</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatRelativeTime(entry.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                if (page > totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}