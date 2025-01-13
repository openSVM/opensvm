'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { updateRpcEndpoint } from './solana-connection';

export type Theme = 'paper' | 'high-contrast' | 'dos' | 'cyberpunk' | 'solarized';
export type FontFamily = 'berkeley' | 'inter' | 'jetbrains';
export type FontSize = 'small' | 'medium' | 'large';

export interface RpcEndpoint {
  name: string;
  url: string;
  network: 'mainnet' | 'devnet' | 'testnet' | 'custom';
}

const defaultRpcEndpoints: RpcEndpoint[] = [
  { name: 'Mainnet (Default)', url: 'https://api.mainnet-beta.solana.com', network: 'mainnet' },
  { name: 'OpenSVM RPC', url: 'opensvm', network: 'mainnet' },
  { name: 'Serum', url: 'https://solana-api.projectserum.com', network: 'mainnet' },
  { name: 'Ankr', url: 'https://rpc.ankr.com/solana', network: 'mainnet' },
  { name: 'Devnet', url: 'https://api.devnet.solana.com', network: 'devnet' },
  { name: 'Testnet', url: 'https://api.testnet.solana.com', network: 'testnet' },
];

interface Settings {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  rpcEndpoint: RpcEndpoint;
  availableRpcEndpoints: RpcEndpoint[];
  customRpcEndpoint: string;
}

interface SettingsContextType extends Settings {
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setRpcEndpoint: (endpoint: RpcEndpoint) => void;
  setCustomRpcEndpoint: (url: string) => void;
  addCustomRpcEndpoint: (name: string, url: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: Settings = {
  theme: 'cyberpunk',
  fontFamily: 'berkeley',
  fontSize: 'medium',
  rpcEndpoint: defaultRpcEndpoints[1], // OpenSVM RPC
  availableRpcEndpoints: defaultRpcEndpoints,
  customRpcEndpoint: '',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Initialize settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Ensure availableRpcEndpoints is always set to defaultRpcEndpoints
        parsed.availableRpcEndpoints = defaultRpcEndpoints;
        setSettings(parsed);
        // Update RPC endpoint in connection pool
        if (parsed.rpcEndpoint) {
          updateRpcEndpoint(parsed.rpcEndpoint.url);
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
        setSettings(defaultSettings);
      }
    }
    setMounted(true);
  }, []);

  // Save settings to localStorage and apply them
  useEffect(() => {
    if (!mounted) return;

    // Save to localStorage
    localStorage.setItem('settings', JSON.stringify(settings));

    // Apply theme
    document.documentElement.classList.remove(
      'theme-paper',
      'theme-high-contrast',
      'theme-dos',
      'theme-cyberpunk',
      'theme-solarized'
    );
    document.documentElement.classList.add(`theme-${settings.theme}`);

    // Apply font family
    document.documentElement.style.setProperty('--font-family', `var(--font-${settings.fontFamily})`);

    // Apply font size
    const fontSizes = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);

    // Update RPC endpoint
    updateRpcEndpoint(settings.rpcEndpoint.url);

  }, [settings, mounted]);

  const contextValue: SettingsContextType = {
    ...settings,
    setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
    setFontFamily: (fontFamily) => setSettings((s) => ({ ...s, fontFamily })),
    setFontSize: (fontSize) => setSettings((s) => ({ ...s, fontSize })),
    setRpcEndpoint: (rpcEndpoint) => {
      setSettings((s) => ({ ...s, rpcEndpoint }));
      updateRpcEndpoint(rpcEndpoint.url);
    },
    setCustomRpcEndpoint: (url) => setSettings((s) => ({ ...s, customRpcEndpoint: url })),
    addCustomRpcEndpoint: (name, url) => {
      const newEndpoint: RpcEndpoint = { name, url, network: 'custom' };
      setSettings((s) => ({
        ...s,
        availableRpcEndpoints: [...s.availableRpcEndpoints, newEndpoint],
        rpcEndpoint: newEndpoint,
      }));
    },
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
