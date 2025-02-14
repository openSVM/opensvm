import { join } from 'path';
import { readdir, readFile } from 'fs/promises';
import { renderToString } from 'react-dom/server';
import { Serve } from 'bun';

// Rate limiting
const API_RATE_LIMIT = {
  limit: 10000,
  windowMs: 60000,
  maxRetries: 10,
};

const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetTime) {
    rateLimits.set(ip, {
      count: 1,
      resetTime: now + API_RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (record.count >= API_RATE_LIMIT.limit) {
    return false;
  }

  record.count++;
  return true;
}

// Basic auth middleware
function checkAuth(headers: Headers): boolean {
  const authHeader = headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  try {
    const credentials = atob(authHeader.slice(6));
    const [username, password] = credentials.split(':');
    return (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    );
  } catch {
    return false;
  }
}

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Admin route protection
    if (url.pathname.startsWith('/admin')) {
      if (!checkAuth(req.headers)) {
        return new Response('Unauthorized', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Access"',
          },
        });
      }
    }

    // API rate limiting
    if (url.pathname.startsWith('/api')) {
      if (!checkRateLimit(ip)) {
        return new Response('Too Many Requests', { status: 429 });
      }
    }

    // Docs route
    if (url.pathname.startsWith('/docs')) {
      const docsDir = join(import.meta.dir, '../vtable_docs');
      
      if (url.pathname === '/docs' || url.pathname === '/docs/') {
        try {
          const files = await readdir(docsDir);
          const mdFiles = files.filter(file => file.endsWith('.md'));
          const html = renderDocsIndex(mdFiles);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
          });
        } catch (error) {
          return new Response('Error loading docs', { status: 500 });
        }
      }

      const slug = url.pathname.slice(6); // Remove /docs/
      if (slug) {
        try {
          const content = await readFile(join(docsDir, `${slug}.md`), 'utf-8');
          const html = renderMarkdown(content);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
          });
        } catch (error) {
          return new Response('Document not found', { status: 404 });
        }
      }
    }

    // Static files
    if (url.pathname.startsWith('/public')) {
      const file = Bun.file(join(import.meta.dir, '..', url.pathname));
      return new Response(file);
    }

    // Default response
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);

// Helper functions for rendering
function renderDocsIndex(files: string[]): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Documentation</title>
        <link href="/public/styles/tailwind.css" rel="stylesheet">
      </head>
      <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-3xl font-bold mb-6">Documentation</h1>
          <div class="grid gap-4">
            ${files
              .map(
                file => `
              <a 
                href="/docs/${file.replace('.md', '')}"
                class="p-4 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ${file.replace('.md', '').replace(/-/g, ' ')}
              </a>
            `
              )
              .join('')}
          </div>
        </div>
      </body>
    </html>
  `;
}

function renderMarkdown(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Documentation</title>
        <link href="/public/styles/tailwind.css" rel="stylesheet">
      </head>
      <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div class="container mx-auto px-4 py-8 prose dark:prose-invert max-w-none">
          ${content}
        </div>
      </body>
    </html>
  `;
}