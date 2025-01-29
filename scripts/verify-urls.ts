import fetch from 'node-fetch';

interface SVMNetwork {
  "Project Name": string;
  "Description": string;
  "GitHub": string;
  "Landing Page": string;
  "Whitepaper": string;
  "Telegram": string;
  "Twitter": string;
  "Discord": string;
}

const networks: SVMNetwork[] = [
  {
    "Project Name": "Eclipse",
    "Description": "Eclipse is building Solana on Ethereum, using the SVM to scale Ethereum. It combines Solana's performance with Ethereum's network effects.",
    "GitHub": "https://github.com/eclipse-labs",
    "Landing Page": "https://www.eclipse.xyz/",
    "Whitepaper": "https://www.eclipse.xyz/whitepaper.pdf",
    "Telegram": "https://t.me/eclipsebuilders",
    "Twitter": "https://x.com/EclipseFND",
    "Discord": "https://discord.com/invite/eclipse-fnd",
  },
  {
    "Project Name": "Lollipop",
    "Description": "Lollipop proposes a formal specification for implementing SVM rollups on top of the Solana Layer 1 blockchain, aiming to enhance scalability.",
    "GitHub": "https://github.com/lollipop-svm",
    "Landing Page": "https://lollipop-svm.org/",
    "Whitepaper": "https://arxiv.org/pdf/2405.08882.pdf",
    "Telegram": "https://t.me/lollipopsvm",
    "Twitter": "https://x.com/lollipopsvm",
    "Discord": "missing",
  },
  {
    "Project Name": "SOON",
    "Description": "SOON is an Ethereum Layer 2 solution utilizing the Solana Virtual Machine to expedite transaction settlement times.",
    "GitHub": "https://github.com/soonlabs",
    "Landing Page": "https://www.soonlabs.org/",
    "Whitepaper": "https://www.soonlabs.org/whitepaper.pdf",
    "Telegram": "https://t.me/soonlabs",
    "Twitter": "https://x.com/soonlabs",
    "Discord": "missing",
  },
  {
    "Project Name": "Termina",
    "Description": "Termina leverages the power of the Solana Virtual Machine to scale ecosystems with dedicated blockspace and throughput.",
    "GitHub": "https://github.com/termina-tech",
    "Landing Page": "https://www.termina.technology/",
    "Whitepaper": "https://www.termina.technology/whitepaper.pdf",
    "Telegram": "https://t.me/terminatech",
    "Twitter": "https://x.com/terminatech",
    "Discord": "missing",
  },
  {
    "Project Name": "Nitro",
    "Description": "Nitro is an Optimistic rollup solution that utilizes the Solana Virtual Machine (SVM) to enable Solana developers to port dApps to various ecosystems.",
    "GitHub": "https://github.com/nitro-protocol",
    "Landing Page": "https://www.nitroprotocol.org/",
    "Whitepaper": "https://www.nitroprotocol.org/whitepaper.pdf",
    "Telegram": "https://t.me/nitroprotocol",
    "Twitter": "https://x.com/nitro_protocol",
    "Discord": "missing",
  },
  {
    "Project Name": "Cascade",
    "Description": "Cascade is an SVM rollup optimized for the IBC ecosystem, allowing Solana projects to deploy and access Cosmos app-chain liquidity.",
    "GitHub": "https://github.com/cascade-protocol",
    "Landing Page": "https://www.cascadeprotocol.org/",
    "Whitepaper": "https://www.cascadeprotocol.org/whitepaper.pdf",
    "Telegram": "https://t.me/cascadeprotocol",
    "Twitter": "https://x.com/cascade_protocol",
    "Discord": "missing",
  }
];

async function verifyUrl(url: string): Promise<boolean> {
  if (url === "missing") return false;
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function verifyNetworks() {
  const verifiedNetworks = await Promise.all(networks.map(async (network) => {
    const verifiedNetwork = { ...network };
    
    // Verify each URL field
    const urlFields = ['GitHub', 'Landing Page', 'Whitepaper', 'Telegram', 'Twitter', 'Discord'] as const;
    
    for (const field of urlFields) {
      const isValid = await verifyUrl(network[field]);
      if (!isValid) {
        verifiedNetwork[field] = "missing";
      }
    }
    
    return verifiedNetwork;
  }));

  return verifiedNetworks;
}

// Run verification and update networks data
verifyNetworks().then(verifiedNetworks => {
  console.log(JSON.stringify(verifiedNetworks, null, 2));
}).catch(error => {
  console.error('Error verifying networks:', error);
});
