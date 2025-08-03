import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { priceId, planKey } = await req.json();

    if (!priceId || !planKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create or retrieve Stripe customer - tied to authenticated user
    let customer;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
      
      // Verify the customer is associated with this user
      if (customer.metadata.userId && customer.metadata.userId !== user.id) {
        return NextResponse.json(
          { error: 'Customer mismatch - please contact support' },
          { status: 403 }
        );
      }
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          role: user.role,
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId: user.id,
        planKey,
      },
      // Restrict what customer can modify in checkout
      allow_promotion_codes: false,
      billing_address_collection: 'required',
    });

    const response = NextResponse.json({ url: checkoutSession.url });
    return securityHeaders(response);
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
});