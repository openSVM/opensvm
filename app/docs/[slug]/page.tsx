import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const title = params.slug.replace(/-/g, ' ');
  return {
    title: `${title} - Documentation`,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'vtable_docs', `${slug}.md`);

  try {
    const content = await fs.readFile(filePath, 'utf8');

    return (
      <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  } catch (error) {
    notFound();
  }
}