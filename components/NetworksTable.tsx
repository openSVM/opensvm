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
    name: "Cascade",
    description: "Cascade is an SVM rollup optimized for the IBC ecosystem, allowing Solana projects to deploy and access Cosmos app-chain liquidity.",
    github: "missing",
    landingPage: "missing",
    whitepaper: "missing",
    telegram: "https://t.me/cascadeprotocol",
    twitter: "https://x.com/cascade_protocol",
    discord: "missing"
  }
];

const NetworksTable: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">SVM Networks Registry</h1>
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
