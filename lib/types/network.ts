export interface SVMNetwork {
  id: string;
  name: string;
  description: string;
  links: {
    github?: string;
    landing?: string;
    whitepaper?: string;
    telegram?: string;
    twitter?: string;
    discord?: string;
    youtube?: string;
    mirror?: string;
    feedback?: string;
  };
  rpc?: {
    mainnet?: string;
    testnet?: string;
    devnet?: string;
  };
  status: 'active' | 'development' | 'deprecated';
  lastUpdated: string;
}

export type NetworkTableColumn = {
  key: keyof SVMNetwork | 'links';
  label: string;
  sortable?: boolean;
};

export const networkColumns: NetworkTableColumn[] = [
  { key: 'name', label: 'Network', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'links', label: 'Resources & RPC' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true },
];
