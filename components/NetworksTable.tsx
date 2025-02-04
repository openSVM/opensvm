import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { SVMNetwork } from '@/lib/types/network';

const networks: SVMNetwork[] = [
  {
    id: "eclipse",
    name: "Eclipse",
    description: "Eclipse is building Solana on Ethereum, using the SVM to scale Ethereum. It combines Solana's performance with Ethereum's network effects.",
    links: {
      github: "https://github.com/Eclipse-Laboratories-Inc",
      landing: "https://www.eclipse.xyz/",
      whitepaper: "https://docs.eclipse.xyz/",
      telegram: "https://t.me/eclipsebuilders",
      twitter: "https://twitter.com/EclipseFND",
      discord: "https://discord.gg/eclipse-labs",
      youtube: "https://www.youtube.com/channel/UCN5NrfmADK2DV4uAv8DZz0g",
      mirror: "https://mirror.xyz/eclipselabs.eth",
      feedback: "https://eclipse.upvoty.com/"
    },
    rpc: {
      mainnet: "https://mainnetbeta-rpc.eclipse.xyz",
      testnet: "https://testnet.dev2.eclipsenetwork.xyz",
      devnet: "https://staging-rpc.dev2.eclipsenetwork.xyz"
    },
    status: "active",
    lastUpdated: "2024-01-29"
  },
  {
    id: "lollipop",
    name: "Lollipop",
    description: "Lollipop proposes a formal specification for implementing SVM rollups on top of the Solana Layer 1 blockchain, aiming to enhance scalability.",
    links: {
      whitepaper: "https://arxiv.org/pdf/2405.08882.pdf",
      telegram: "https://t.me/lollipopsvm",
      twitter: "https://x.com/lollipopsvm"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "soon",
    name: "SOON",
    description: "SOON is an Ethereum Layer 2 solution utilizing the Solana Virtual Machine to expedite transaction settlement times.",
    links: {
      github: "https://github.com/soonlabs",
      telegram: "https://t.me/soonlabs",
      twitter: "https://x.com/soonlabs"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "termina",
    name: "Termina",
    description: "Termina leverages the power of the Solana Virtual Machine to scale ecosystems with dedicated blockspace and throughput.",
    links: {
      landing: "https://www.termina.technology/",
      telegram: "https://t.me/terminatech",
      twitter: "https://x.com/terminatech"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "nitro",
    name: "Nitro",
    description: "Nitro is an Optimistic rollup solution that utilizes the Solana Virtual Machine (SVM) to enable Solana developers to port dApps to various ecosystems.",
    links: {
      telegram: "https://t.me/nitroprotocol",
      twitter: "https://x.com/nitro_protocol"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "sonic",
    name: "Sonic SVM",
    description: "Sonic is the first chain extension on Solana, designed for games and applications, and is powered by the Sonic HyperGrid Framework.",
    links: {
      landing: "https://www.sonic.game/"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "magicblock",
    name: "MagicBlock",
    description: "MagicBlock introduces Ephemeral Rollups, SVM-based runtimes that accelerate state transitions for selected Solana accounts, enhancing performance for on-chain games and applications.",
    links: {
      github: "https://github.com/magicblock-labs/ephemeral-rollups-spl",
      landing: "https://magicblock.gg/",
      whitepaper: "https://docs.magicblock.gg/introduction"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "fogo",
    name: "Fogo",
    description: "Fogo is a high-performance Layer 1 blockchain built on the Solana Virtual Machine (SVM), utilizing the Firedancer client to achieve real-time experiences at scale.",
    links: {
      landing: "https://fogo.io",
      whitepaper: "https://fogo.io/whitepaper",
      twitter: "https://x.com/FogoChain"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "solayer",
    name: "Solayer",
    description: "Solayer is a hardware-accelerated blockchain designed to infinitely scale the SVM, enabling high-throughput, near-zero latency use cases.",
    links: {
      landing: "https://solayer.io",
      twitter: "https://x.com/SolayerFdn"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "mantis",
    name: "Mantis",
    description: "Mantis is a groundbreaking project on Solana that aims to revolutionize cross-chain trading and MEV extraction through its multi-chain intent settlement protocol.",
    links: {
      github: "https://github.com/ComposableFi/mantis-solana",
      landing: "https://mantis.app/",
      whitepaper: "https://docs.mantis.app/",
      twitter: "https://x.com/mantis"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "code",
    name: "Code",
    description: "Code is a mobile app leveraging self-custodial blockchain technology to deliver a seamless payments experience that is instant, global, and private.",
    links: {
      github: "https://github.com/code-payments/code-vm",
      landing: "https://getcode.com/"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "grass",
    name: "Grass",
    description: "Grass is a decentralized AI data collection network built on the Solana blockchain, allowing users to earn rewards by sharing their unused internet bandwidth.",
    links: {
      landing: "https://www.getgrass.io/",
      twitter: "https://x.com/getgrass_io"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "atlas",
    name: "Atlas SVM",
    description: "Atlas is a blockchain optimized for verifiable finance, combining traditional finance's performance with DeFi's transparency.",
    links: {
      landing: "https://www.atlas.xyz/"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  },
  {
    id: "sovereign",
    name: "Sovereign Labs",
    description: "Sovereign Labs is developing an ecosystem of seamlessly interoperable and scalable rollups that can run on any blockchain, leveraging proof aggregation and zk-rollup components to enhance scalability and interoperability.",
    links: {
      github: "https://github.com/Sovereign-Labs",
      landing: "https://www.sovereign.xyz/",
      twitter: "https://x.com/Sovereign_Labs",
      discord: "https://discord.gg/sovereign-labs"
    },
    status: "development",
    lastUpdated: "2024-01-29"
  }
];

const NetworksTable: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold">SVM Networks Registry</h1>
        <Link
          href="https://blog.superteam.fun/p/solana-need-l2s-and-appchains"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:text-primary/80"
        >
          (What is SVM?)
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-background border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="px-6 py-3 text-left text-sm font-semibold">Project</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {networks.map((network) => (
              <tr key={network.name} className="hover:bg-muted/50">
                <td className="px-6 py-4">
                  <div className="font-semibold">{network.name}</div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">{network.description}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {network.links?.github && (
                      <Link
                        href={network.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        GitHub
                      </Link>
                    )}
                    {network.links?.landing && (
                      <Link
                        href={network.links.landing}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Website
                      </Link>
                    )}
                    {network.links?.whitepaper && (
                      <Link
                        href={network.links.whitepaper}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Whitepaper
                      </Link>
                    )}
                    {network.links?.telegram && (
                      <Link
                        href={network.links.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Telegram
                      </Link>
                    )}
                    {network.links?.twitter && (
                      <Link
                        href={network.links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Twitter
                      </Link>
                    )}
                    {network.links?.discord && (
                      <Link
                        href={network.links.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Discord
                      </Link>
                    )}
                    {network.links?.youtube && (
                      <Link
                        href={network.links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        YouTube
                      </Link>
                    )}
                    {network.links?.mirror && (
                      <Link
                        href={network.links.mirror}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Mirror
                      </Link>
                    )}
                    {network.links?.feedback && (
                      <Link
                        href={network.links.feedback}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Feedback
                      </Link>
                    )}
                    {network.rpc && (
                      <div className="flex flex-col gap-1 mt-2">
                        {network.rpc.mainnet && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Mainnet:</span>{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {network.rpc.mainnet}
                            </code>
                          </div>
                        )}
                        {network.rpc.testnet && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Testnet:</span>{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {network.rpc.testnet}
                            </code>
                          </div>
                        )}
                        {network.rpc.devnet && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Devnet:</span>{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {network.rpc.devnet}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NetworksTable;
