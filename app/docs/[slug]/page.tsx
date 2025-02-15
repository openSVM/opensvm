import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const title = resolvedParams.slug.replace(/-/g, ' ');
  return {
    title: `${title} - Documentation`,
  };
}

export default async function DocPage({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  // Use path.join with __dirname to get the correct path in both dev and prod
  const docsDir = path.join(process.cwd(), 'agent_notes', 'vtable_study', 'vtable_docs');
  const filePath = path.join(docsDir, `${slug}.md`);

  try {
    // Verify directory exists
    try {
      await fs.access(docsDir);
    } catch (error) {
      console.error(`Docs directory not found: ${docsDir}`);
      notFound();
    }

    const content = await fs.readFile(filePath, 'utf8');

    return (
      <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  } catch (error) {
    console.error(`Error reading doc file: ${filePath}`, error);
    notFound();
  }
}