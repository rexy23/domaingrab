import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';

// Paths that require CSRF protection
const PROTECTED_PATHS = [
  '/api/search',
  '/api/domain',
  '/api/user',
  '/api/create-checkout-session',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

// Paths that should be excluded from CSRF protection
const EXCLUDED_PATHS = [
  '/api/webhooks', // Webhooks need to accept external POST requests
  '/api/auth/[...nextauth]', // NextAuth handles its own CSRF
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if path needs CSRF protection
  const needsProtection = PROTECTED_PATHS.some(p => path.startsWith(p)) &&
                         !EXCLUDED_PATHS.some(p => path.startsWith(p));

  if (needsProtection) {
    // Validate CSRF token
    const isValid = await CSRFProtection.validateRequest(request);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // CSP header
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};