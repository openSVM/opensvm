import React from 'react';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-8">
        <div className="container mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}