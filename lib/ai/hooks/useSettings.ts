import { useState, useEffect } from 'react';

interface Settings {
  rpcEndpoint: string;
  theme: 'dark' | 'light' | 'system';
  autoClear: boolean;
  temperature: number;
  maxTokens: number;
}

const defaultSettings: Settings = {
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  theme: 'dark',
  autoClear: false,
  temperature: 0.7,
  maxTokens: 2048,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage on initial render
    const savedSettings = localStorage.getItem('settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
} 