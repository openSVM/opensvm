'use client';

import { useState } from 'react';
import { SVMNetwork, NetworkTableColumn, networkColumns } from '@/lib/types/network';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpDown, 
  Github, 
  Globe, 
  FileText, 
  MessageCircle, 
  Twitter, 
  MessageSquare 
} from 'lucide-react';

interface NetworksTableProps {
  networks: SVMNetwork[];
}

export function NetworksTable({ networks }: NetworksTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SVMNetwork;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null);

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleDescriptionClick = (networkId: string) => {
    setExpandedDescription(expandedDescription === networkId ? null : networkId);
  };

  const sortedNetworks = [...networks].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof SVMNetwork) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortButton = (column: NetworkTableColumn) => {
    if (!column.sortable) return null;
    
    return (
      <Button
        variant="ghost"
        onClick={() => handleSort(column.key as keyof SVMNetwork)}
        className="h-8 px-2"
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    );
  };

  const renderLinks = (links: SVMNetwork['links']) => {
    return (
      <div className="flex gap-2">
        {links.github && (
          <Link href={links.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Github className="h-5 w-5" />
          </Link>
        )}
        {links.landing && (
          <Link href={links.landing} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Globe className="h-5 w-5" />
          </Link>
        )}
        {links.whitepaper && (
          <Link href={links.whitepaper} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <FileText className="h-5 w-5" />
          </Link>
        )}
        {links.telegram && (
          <Link href={links.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <MessageCircle className="h-5 w-5" />
          </Link>
        )}
        {links.twitter && (
          <Link href={links.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <Twitter className="h-5 w-5" />
          </Link>
        )}
        {links.discord && (
          <Link href={links.discord} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <MessageSquare className="h-5 w-5" />
          </Link>
        )}
      </div>
    );
  };

  const getStatusColor = (status: SVMNetwork['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'development':
        return 'text-yellow-500';
      case 'deprecated':
        return 'text-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {networkColumns.map((column) => (
              <th key={column.key} className="h-12 px-4 text-left align-middle font-medium">
                <div className="flex items-center gap-2">
                  {column.label}
                  {renderSortButton(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedNetworks.map((network) => (
            <tr key={network.id} className="border-b">
              <td className="p-4 align-middle font-medium">{network.name}</td>
              <td 
                className="p-4 align-middle cursor-pointer group relative"
                onClick={() => handleDescriptionClick(network.id)}
              >
                <div className={`
                  transition-all duration-200 ease-in-out
                  ${expandedDescription === network.id ? 'text-primary' : 'group-hover:text-primary'}
                `}>
                  {expandedDescription === network.id 
                    ? network.description
                    : (
                      <>
                        {truncateDescription(network.description)}
                        <span className="ml-1 text-xs text-muted-foreground group-hover:text-primary">
                          (click to expand)
                        </span>
                      </>
                    )
                  }
                </div>
              </td>
              <td className="p-4 align-middle">{renderLinks(network.links)}</td>
              <td className="p-4 align-middle">
                <span className={getStatusColor(network.status)}>
                  {network.status.charAt(0).toUpperCase() + network.status.slice(1)}
                </span>
              </td>
              <td className="p-4 align-middle">{network.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
