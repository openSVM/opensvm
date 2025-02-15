import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';

export const metadata = {
  title: 'Documentation',
};

export default async function DocsPage() {
  const docsDir = path.join(process.cwd(), 'agent_notes', 'vtable_study', 'vtable_docs');

  try {
    // Verify directory exists
    try {
      await fs.access(docsDir);
    } catch (error) {
      console.error(`Docs directory not found: ${docsDir}`);
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Documentation</h1>
          <p className="text-red-500">Documentation directory not found. Please ensure all documentation files are properly installed.</p>
        </div>
      );
    }

    const files = await fs.readdir(docsDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    if (mdFiles.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Documentation</h1>
          <p>No documentation files found.</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>
        <div className="grid gap-4">
          {mdFiles.map((file) => (
            <Link 
              key={file}
              href={`/docs/${encodeURIComponent(file.replace('.md', ''))}`}
              className="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {file.replace('.md', '').replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading documentation:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>
        <p className="text-red-500">Error loading documentation. Please try again later.</p>
      </div>
    );
  }
}