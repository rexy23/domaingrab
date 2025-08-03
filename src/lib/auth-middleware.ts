import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AuthorizedUser {
  id: string;
  email: string;
  role: UserRole;
}

export async function withAuth(
  handler: (req: NextRequest, user: AuthorizedUser) => Promise<NextResponse>,
  options?: {
    roles?: UserRole[];
    requireSameUser?: boolean;
  }
) {
  return async (req: NextRequest) => {
    try {
      // Get session
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }

      // Create authorized user object
      const user: AuthorizedUser = {
        id: session.user.id,
        email: session.user.email!,
        role: (session.user as any).role || 'user',
      };

      // Check role permissions
      if (options?.roles && !options.roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check same-user requirement (for accessing own resources)
      if (options?.requireSameUser) {
        const requestedUserId = req.nextUrl.searchParams.get('userId') || 
                               req.headers.get('x-user-id');
        
        if (requestedUserId && requestedUserId !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Forbidden - You can only access your own data' },
            { status: 403 }
          );
        }
      }

      // Call the handler with authenticated user
      return handler(req, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to check if user owns a resource
export async function userOwnsResource(
  userId: string,
  resourceOwnerId: string,
  userRole: UserRole
): Promise<boolean> {
  // Admins can access any resource
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true;
  }
  
  // Regular users can only access their own resources
  return userId === resourceOwnerId;
}

// Security headers middleware
export function securityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}