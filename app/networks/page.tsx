import { NetworksTable } from '@/components/NetworksTable';
import { SVMNetwork } from '@/lib/types/network';

const networks: SVMNetwork[] = [
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Eclipse is building Solana on Ethereum, using the SVM to scale Ethereum. It combines Solana\'s performance with Ethereum\'s network effects, allowing developers to build on a network that inherits Ethereum\'s security properties.',
    links: {
      github: 'https://github.com/eclipse-labs',
      landing: 'https://www.eclipse.builders/',
      whitepaper: 'https://www.eclipse.builders/whitepaper.pdf',
      telegram: 'https://t.me/eclipsebuilders',
      twitter: 'https://twitter.com/eclipsebuilders',
      discord: 'https://discord.com/invite/eclipsebuilders'
    },
    status: 'active',
    lastUpdated: '2024-01-29'
  },
  {
    id: 'lollipop',
    name: 'Lollipop',
    description: 'Lollipop proposes a formal specification for implementing SVM rollups on top of the Solana Layer 1 blockchain, aiming to enhance scalability and modularity.',
    links: {
      github: 'https://github.com/lollipop-svm',
      landing: 'https://lollipop-svm.org/',
      whitepaper: 'https://arxiv.org/pdf/2405.08882.pdf',
      telegram: 'https://t.me/lollipopsvm',
      twitter: 'https://twitter.com/lollipopsvm',
      discord: 'https://discord.com/invite/lollipopsvm'
    },
    status: 'development',
    lastUpdated: '2024-01-29'
  },
  {
    id: 'soon',
    name: 'SOON',
    description: 'SOON is an Ethereum Layer 2 solution utilizing the Solana Virtual Machine to expedite transaction settlement times. It aims to combine the efficiency of SVM with Ethereum\'s security.',
    links: {
      github: 'https://github.com/soonlabs',
      landing: 'https://www.soonlabs.org/',
      whitepaper: 'https://www.soonlabs.org/whitepaper.pdf',
      telegram: 'https://t.me/soonlabs',
      twitter: 'https://twitter.com/soonlabs',
      discord: 'https://discord.com/invite/soonlabs'
    },
    status: 'development',
    lastUpdated: '2024-01-29'
  },
  {
    id: 'termina',
    name: 'Termina',
    description: 'Termina leverages the power of the Solana Virtual Machine to scale ecosystems with dedicated blockspace and throughput, enhancing performance for decentralized applications.',
    links: {
      github: 'https://github.com/termina-tech',
      landing: 'https://www.termina.technology/',
      whitepaper: 'https://www.termina.technology/whitepaper.pdf',
      telegram: 'https://t.me/terminatech',
      twitter: 'https://twitter.com/terminatech',
      discord: 'https://discord.com/invite/termina'
    },
    status: 'development',
    lastUpdated: '2024-01-29'
  },
  {
    id: 'nitro',
    name: 'Nitro',
    description: 'Nitro is an Optimistic rollup solution that utilizes the Solana Virtual Machine (SVM) to enable Solana developers to port their decentralized applications (dApps) to various ecosystems.',
    links: {
      github: 'https://github.com/nitro-protocol',
      landing: 'https://www.nitroprotocol.org/',
      whitepaper: 'https://www.nitroprotocol.org/whitepaper.pdf',
      telegram: 'https://t.me/nitroprotocol',
      twitter: 'https://twitter.com/nitro_protocol',
      discord: 'https://discord.com/invite/nitroprotocol'
    },
    status: 'development',
    lastUpdated: '2024-01-29'
  },
  {
    id: 'cascade',
    name: 'Cascade',
    description: 'Cascade is an SVM rollup optimized for the Inter-Blockchain Communication (IBC) ecosystem, allowing Solana projects to deploy seamlessly and access Cosmos app-chain liquidity.',
    links: {
      github: 'https://github.com/cascade-protocol',
      landing: 'https://www.cascadeprotocol.org/',
      whitepaper: 'https://www.cascadeprotocol.org/whitepaper.pdf',
      telegram: 'https://t.me/cascadeprotocol',
      twitter: 'https://twitter.com/cascade_protocol',
      discord: 'https://discord.com/invite/cascadeprotocol'
    },
    status: 'development',
    lastUpdated: '2024-01-29'
  }
];

export default function NetworksPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">SVM Networks Registry</h1>
        <p className="text-muted-foreground">
          A comprehensive list of Solana Virtual Machine (SVM) networks, including their resources and current status.
        </p>
      </div>
      <NetworksTable networks={networks} />
    </div>
  );
}
