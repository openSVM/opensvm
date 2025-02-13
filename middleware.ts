import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Add CORS headers to all responses
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle favicon request
  if (request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.rewrite(new URL('/api/favicon', request.url));
  }

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Handle public assets
  if (request.nextUrl.pathname.startsWith('/public/') || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.endsWith('.svg') ||
      request.nextUrl.pathname.endsWith('.ico')) {
    return NextResponse.next({
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Handle admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
        return new NextResponse('Invalid credentials', { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
    } catch {
      return new NextResponse('Invalid credentials', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  }

  // Add default security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add custom headers for better error handling
  response.headers.set('X-Error-Message', 'Please try again later if you encounter any issues');
  response.headers.set('X-Rate-Limit-Retry-After', '60');
  response.headers.set('X-Rate-Limit-Limit', '100');

  // Add request timing headers
  response.headers.set('X-Request-Start', startTime.toString());
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Set appropriate timeouts and cache headers based on route
  if (request.nextUrl.pathname.startsWith('/tx/')) {
    // Transaction pages get longer timeout and more aggressive caching
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    response.headers.set('X-Response-Timeout', '15000'); // 15 seconds
    response.headers.set('X-Cache-Status', 'dynamic');
  } else if (request.nextUrl.pathname.startsWith('/account/')) {
    // Account pages get medium timeout and moderate caching
    response.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30');
    response.headers.set('X-Response-Timeout', '10000'); // 10 seconds
    response.headers.set('X-Cache-Status', 'dynamic');
  } else {
    // Other dynamic routes get shorter timeout and minimal caching
    response.headers.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=15');
    response.headers.set('X-Response-Timeout', '5000'); // 5 seconds
    response.headers.set('X-Cache-Status', 'dynamic');
  }

  // Add response timing header
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
