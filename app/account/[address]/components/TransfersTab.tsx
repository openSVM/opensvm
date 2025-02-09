"use client";

import { memo } from 'react';
import { TransfersTable } from '@/components/TransfersTable';

interface Props {
  address: string;
}

function TransfersTabComponent({ address }: Props) {
  return (
    <div className="w-full h-full">
      <TransfersTable key={address} address={address} />
    </div>
  );
}

export default memo(TransfersTabComponent);
