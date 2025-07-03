'use client';

import { ExternalLink } from 'lucide-react';

interface AccountExplorerLinksProps {
  address: string;
  className?: string;
}

export default function AccountExplorerLinks({ address, className = '' }: AccountExplorerLinksProps) {
  const explorerLinks = [
    {
      name: 'Solscan',
      url: `https://solscan.io/account/${address}`,
      description: 'View on Solscan'
    },
    {
      name: 'Step Finance',
      url: `https://step.finance/en/portfolio?watching=${address}`,
      description: 'View on Step Finance'
    }
  ];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-sm text-neutral-400 mb-1">External Explorers</div>
      <div className="flex flex-wrap gap-2">
        {explorerLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
            title={link.description}
          >
            {link.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}