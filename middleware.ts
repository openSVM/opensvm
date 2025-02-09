import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter, RateLimitError } from '@/lib/rate-limit';

// Rate limit configuration for API endpoints
const API_RATE_LIMIT = {
  limit: 10000,        // 100 requests
  windowMs: 60000,   // per minute
  maxRetries: 10,     // No retries for API endpoints
  initialRetryDelay: 10,
  maxRetryDelay: 500
};

// Separate limits for specific API endpoints
const ENDPOINT_LIMITS: { [key: string]: typeof API_RATE_LIMIT } = {
  '/api/token': {
    limit: 20000,      // More generous limit for token endpoints
    windowMs: 60000,
    maxRetries: 10,
    initialRetryDelay: 10,
    maxRetryDelay: 5000
  },
  '/api/historical-data': {
    limit: 50000,       // More conservative for heavy endpoints
    windowMs: 60000,
    maxRetries: 10,
    initialRetryDelay: 10,
    maxRetryDelay: 5000
  }
};

export async function middleware(request: NextRequest) {
  // Handle admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"'
        }
      });
    }

    try {
      const credentials = atob(authHeader.split(' ')[1]);
      const [username, password] = credentials.split(':');

      if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        return new NextResponse('Invalid credentials', { status: 401 });
      }
    } catch {
      return new NextResponse('Invalid credentials', { status: 401 });
    }

    return NextResponse.next();
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, solana-client',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    // Find matching endpoint config or use default
    const config = Object.entries(ENDPOINT_LIMITS).find(([path]) => 
      request.nextUrl.pathname.startsWith(path)
    )?.[1] || API_RATE_LIMIT;

    // Apply rate limit
    await rateLimiter.rateLimit(`${ip}-${request.nextUrl.pathname}`, config);
    
    const response = NextResponse.next();
    
    // Add CORS headers to all API responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, solana-client');
    
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      const response = NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(error.retryAfter / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(error.retryAfter / 1000).toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, solana-client'
          }
        }
      );
      return response;
    }
    
    // For other errors, return 500
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, solana-client'
        }
      }
    );
    return response;
  }
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
