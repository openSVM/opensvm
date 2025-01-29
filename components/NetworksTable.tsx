import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SVMNetwork {
  name: string;
  description: string;
  github: string;
  landingPage: string;
  whitepaper: string;
  telegram: string;
  twitter: string;
  discord: string;
}

const networks: SVMNetwork[] = [
  {
    name: "Eclipse",
    description: "Eclipse is building Solana on Ethereum, using the SVM to scale Ethereum. It combines Solana's performance with Ethereum's network effects.",
    github: "https://github.com/eclipse-labs",
    landingPage: "https://www.eclipse.xyz/",
    whitepaper: "missing",
    telegram: "https://t.me/eclipsebuilders",
    twitter: "https://x.com/EclipseFND",
    discord: "https://discord.com/invite/eclipse-fnd"
  },
  {
    name: "Lollipop",
    description: "Lollipop proposes a formal specification for implementing SVM rollups on top of the Solana Layer 1 blockchain, aiming to enhance scalability.",
    github: "missing",
    landingPage: "missing",
    whitepaper: "https://arxiv.org/pdf/2405.08882.pdf",
    telegram: "https://t.me/lollipopsvm",
    twitter: "https://x.com/lollipopsvm",
    discord: "missing"
  },
  {
    name: "SOON",
    description: "SOON is an Ethereum Layer 2 solution utilizing the Solana Virtual Machine to expedite transaction settlement times.",
    github: "https://github.com/soonlabs",
    landingPage: "missing",
    whitepaper: "missing",
    telegram: "https://t.me/soonlabs",
    twitter: "https://x.com/soonlabs",
    discord: "missing"
  },
  {
    name: "Termina",
    description: "Termina leverages the power of the Solana Virtual Machine to scale ecosystems with dedicated blockspace and throughput.",
    github: "missing",
    landingPage: "https://www.termina.technology/",
    whitepaper: "missing",
    telegram: "https://t.me/terminatech",
    twitter: "https://x.com/terminatech",
    discord: "missing"
  },
  {
    name: "Nitro",
    description: "Nitro is an Optimistic rollup solution that utilizes the Solana Virtual Machine (SVM) to enable Solana developers to port dApps to various ecosystems.",
    github: "missing",
    landingPage: "missing",
    whitepaper: "missing",
    telegram: "https://t.me/nitroprotocol",
    twitter: "https://x.com/nitro_protocol",
    discord: "missing"
  },
  {
    name: "Sonic SVM",
    description: "Sonic is the first chain extension on Solana, designed for games and applications, and is powered by the Sonic HyperGrid Framework.",
    github: "missing",
    landingPage: "https://www.sonic.game/",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "missing",
    discord: "missing"
  },
  {
    name: "MagicBlock",
    description: "MagicBlock introduces Ephemeral Rollups, SVM-based runtimes that accelerate state transitions for selected Solana accounts, enhancing performance for on-chain games and applications.",
    github: "https://github.com/magicblock-labs/ephemeral-rollups-spl",
    landingPage: "https://magicblock.gg/",
    whitepaper: "https://docs.magicblock.gg/introduction",
    telegram: "missing",
    twitter: "missing",
    discord: "missing"
  },
  {
    name: "Fogo",
    description: "Fogo is a high-performance Layer 1 blockchain built on the Solana Virtual Machine (SVM), utilizing the Firedancer client to achieve real-time experiences at scale.",
    github: "missing",
    landingPage: "https://fogo.io",
    whitepaper: "https://fogo.io/whitepaper",
    telegram: "missing",
    twitter: "https://x.com/FogoChain",
    discord: "missing"
  },
  {
    name: "Solayer",
    description: "Solayer is a hardware-accelerated blockchain designed to infinitely scale the SVM, enabling high-throughput, near-zero latency use cases.",
    github: "missing",
    landingPage: "https://solayer.io",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "https://x.com/SolayerFdn",
    discord: "missing"
  },
  {
    name: "Mantis",
    description: "Mantis is a groundbreaking project on Solana that aims to revolutionize cross-chain trading and MEV extraction through its multi-chain intent settlement protocol.",
    github: "https://github.com/ComposableFi/mantis-solana",
    landingPage: "https://mantis.app/",
    whitepaper: "https://docs.mantis.app/",
    telegram: "missing",
    twitter: "https://x.com/mantis",
    discord: "missing"
  },
  {
    name: "Code",
    description: "Code is a mobile app leveraging self-custodial blockchain technology to deliver a seamless payments experience that is instant, global, and private.",
    github: "https://github.com/code-payments/code-vm",
    landingPage: "https://getcode.com/",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "missing",
    discord: "missing"
  },
  {
    name: "Grass",
    description: "Grass is a decentralized AI data collection network built on the Solana blockchain, allowing users to earn rewards by sharing their unused internet bandwidth.",
    github: "missing",
    landingPage: "https://www.getgrass.io/",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "https://x.com/getgrass_io",
    discord: "missing"
  },
  {
    name: "Atlas SVM",
    description: "Atlas is a blockchain optimized for verifiable finance, combining traditional finance's performance with DeFi's transparency.",
    github: "missing",
    landingPage: "https://www.atlas.xyz/",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "missing",
    discord: "missing"
  },
  {
    name: "Sovereign Labs",
    description: "Sovereign Labs is developing an ecosystem of seamlessly interoperable and scalable rollups that can run on any blockchain, leveraging proof aggregation and zk-rollup components to enhance scalability and interoperability.",
    github: "https://github.com/Sovereign-Labs",
    landingPage: "https://www.sovereign.xyz/",
    whitepaper: "missing",
    telegram: "missing",
    twitter: "https://x.com/Sovereign_Labs",
    discord: "https://discord.gg/sovereign-labs"
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
                    {network.github !== "missing" && (
                      <Link
                        href={network.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        GitHub
                      </Link>
                    )}
                    {network.landingPage !== "missing" && (
                      <Link
                        href={network.landingPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Website
                      </Link>
                    )}
                    {network.whitepaper !== "missing" && (
                      <Link
                        href={network.whitepaper}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Whitepaper
                      </Link>
                    )}
                    {network.telegram !== "missing" && (
                      <Link
                        href={network.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Telegram
                      </Link>
                    )}
                    {network.twitter !== "missing" && (
                      <Link
                        href={network.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Twitter
                      </Link>
                    )}
                    {network.discord !== "missing" && (
                      <Link
                        href={network.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/80"
                      >
                        Discord
                      </Link>
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
