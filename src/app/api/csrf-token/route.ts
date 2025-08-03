import { NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/csrf';

export async function GET() {
  const token = CSRFProtection.generateToken();
  
  const response = NextResponse.json({ token });
  
  // Set the CSRF token as both httpOnly and readable cookies
  // HttpOnly cookie for server-side validation
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  
  // Readable cookie for client-side to include in headers
  response.cookies.set('csrf-token-client', token, {
    httpOnly: false, // Must be accessible by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  
  return response;
}