import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.log('Stripe webhook received');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('Webhook event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract customer info
        const customerEmail = session.customer_email || session.customer_details?.email;
        const customerName = session.customer_details?.name;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const setupToken = session.metadata?.setupToken;
        const planType = session.metadata?.planType || 'pro';
        
        if (!customerEmail) {
          console.error('No customer email found in session');
          return NextResponse.json({ error: 'No customer email' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single();

        if (!existingUser) {
          console.log('Creating new user for email:', customerEmail);
          // Create new user with temporary password
          const tempPassword = crypto.randomBytes(32).toString('hex');
          
          // Create user in Supabase
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email: customerEmail,
              name: customerName,
              password_hash: tempPassword, // This will be replaced when user sets their password
              stripe_customer_id: customerId,
              subscription_tier: planType,
              subscription_status: 'active',
              setup_token: setupToken,
              setup_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
              is_setup_complete: false,
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Failed to create user:', createError);
            console.error('Error details:', JSON.stringify(createError, null, 2));
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
          }

          console.log('New user created successfully:', newUser.id);
        } else {
          // Update existing user
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
              subscription_tier: planType,
              subscription_status: 'active',
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Failed to update user:', updateError);
          }
        }

        // Store subscription details
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            id: subscriptionId,
            user_id: existingUser?.id || (await supabase
              .from('users')
              .select('id')
              .eq('email', customerEmail)
              .single()).data?.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_type: planType,
            current_period_end: new Date(session.expires_at * 1000).toISOString(),
          });

        if (subError) {
          console.error('Failed to store subscription:', subError);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to update subscription:', error);
        }

        // Also update user's subscription status
        const { error: userError } = await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (userError) {
          console.error('Failed to update user subscription status:', userError);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Failed to update cancelled subscription:', error);
        }

        // Update user to free tier
        const { error: userError } = await supabase
          .from('users')
          .update({
            subscription_status: 'cancelled',
            subscription_tier: 'free',
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (userError) {
          console.error('Failed to update user to free tier:', userError);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}