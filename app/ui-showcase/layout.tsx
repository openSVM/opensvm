import type { Metadata } from 'next';
import '@/app/styles/paper-theme-enhancements.css';

export const metadata: Metadata = {
  title: 'UI Design Concept - OpenSVM',
  description: 'Showcase of clean, minimalist interface design with refined metrics display for OpenSVM',
};

export default function UIShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ui-showcase">
      {children}
    </div>
  );
}