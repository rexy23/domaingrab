import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with setup token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, setup_token_expiry, is_setup_complete')
      .eq('setup_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Invalid setup token' },
        { status: 400 }
      );
    }


    // Check if token is expired
    if (user.setup_token_expiry) {
      const expiryDate = new Date(user.setup_token_expiry);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'Setup token has expired' },
          { status: 400 }
        );
      }
    }

    // Check if already set up
    if (user.is_setup_complete) {
      return NextResponse.json(
        { error: 'Account already set up' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user with hashed password and mark setup as complete
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        is_setup_complete: true,
        setup_token: null,
        setup_token_expiry: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to set up password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password set up successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}