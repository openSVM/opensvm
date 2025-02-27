import { Search } from 'lucide-react';

export interface SearchIconProps {
  size?: number;
  className?: string;
}

export default function SearchIcon({ size = 20, className }: SearchIconProps) {
  return <Search size={size} className={className} />;
}