import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class CSRFProtection {
  /**
   * Generate a new CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  }

  /**
   * Set CSRF token in cookies
   */
  static async setToken(): Promise<string> {
    const token = this.generateToken();
    const cookieStore = await cookies();
    
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    return token;
  }

  /**
   * Get CSRF token from cookies
   */
  static async getToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(CSRF_TOKEN_NAME);
    return token?.value || null;
  }

  /**
   * Validate CSRF token from request
   */
  static async validateRequest(request: NextRequest): Promise<boolean> {
    // Skip validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    // Get token from cookie
    const cookieToken = await this.getToken();
    if (!cookieToken) {
      return false;
    }

    // Get token from header or body
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    
    // For form submissions, also check body
    let bodyToken: string | null = null;
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.clone().json();
        bodyToken = body._csrf || body.csrfToken || null;
      } catch {
        // Invalid JSON, ignore
      }
    }

    const requestToken = headerToken || bodyToken;
    
    // Validate token
    return requestToken === cookieToken;
  }

  /**
   * Middleware to validate CSRF token
   */
  static middleware() {
    return async (request: NextRequest) => {
      const isValid = await this.validateRequest(request);
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return null; // Continue to next middleware
    };
  }
}

/**
 * Hook to get CSRF token for forms
 */
export async function getCSRFToken(): Promise<string> {
  let token = await CSRFProtection.getToken();
  
  if (!token) {
    token = await CSRFProtection.setToken();
  }
  
  return token;
}