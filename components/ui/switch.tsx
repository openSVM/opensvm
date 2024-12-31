'use client';

import * as React from 'react';
import { Text } from 'rinlab';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Text variant="label">{label}</Text>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
          checked ? 'bg-[#00ffbd]' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
} 