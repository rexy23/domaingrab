import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { stripe } from '@/lib/stripe-server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, setupToken } = await request.json();

    if (!sessionId || !setupToken) {
      return NextResponse.json(
        { error: 'Session ID and setup token are required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid checkout session' },
        { status: 400 }
      );
    }

    const customerEmail = session.customer_email || session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const planType = session.metadata?.planType || 'pro';

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No customer email found' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, setup_token')
      .eq('email', customerEmail)
      .single();

    if (existingUser) {
      // User already exists, check if they need setup
      if (existingUser.setup_token === setupToken) {
        return NextResponse.json({
          needsSetup: true,
          email: customerEmail
        });
      }
      return NextResponse.json({
        needsSetup: false,
        message: 'User already exists'
      });
    }

    // Create new user
    console.log('Creating user via fallback method for:', customerEmail);
    const tempPassword = crypto.randomBytes(32).toString('hex');
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: customerEmail,
        name: customerName,
        password_hash: tempPassword,
        stripe_customer_id: customerId,
        subscription_tier: planType,
        subscription_status: 'active',
        setup_token: setupToken,
        setup_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_setup_complete: false,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create user via fallback:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Also create/update subscription record
    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .upsert({
          id: subscriptionId,
          user_id: newUser.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plan_type: planType,
          current_period_end: new Date(session.expires_at * 1000).toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      needsSetup: true,
      email: customerEmail
    });
  } catch (error) {
    console.error('Create pending user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}