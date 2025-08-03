import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    // Check if user exists with this setup token and needs setup
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_setup_complete, setup_token_expiry')
      .eq('setup_token', token)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid token', needsSetup: false },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (user.setup_token_expiry) {
      const expiryDate = new Date(user.setup_token_expiry);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Token expired', needsSetup: false },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      needsSetup: !user.is_setup_complete,
      email: user.email,
    });
  } catch (error) {
    console.error('Check setup token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}