'use client';

import { useRouter } from 'next/navigation';

interface AccountLinkProps {
  address: string;
  className?: string;
  children?: React.ReactNode;
}

export default function AccountLink({ address, className, children }: AccountLinkProps) {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/account/${address}`);
  };

  return (
    <a href={`/account/${address}`} onClick={handleClick} className={className}>
      {children || address}
    </a>
  );
}