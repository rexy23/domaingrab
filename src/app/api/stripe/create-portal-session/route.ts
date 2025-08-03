import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';

export const POST = withAuth(async (_req: NextRequest, user) => {
  try {
    // Get customer ID - user can only access their own billing portal
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    const customer = customers.data[0];
    
    // Verify the customer belongs to this user
    if (customer.metadata.userId && customer.metadata.userId !== user.id) {
      return NextResponse.json(
        { error: 'Customer mismatch - please contact support' },
        { status: 403 }
      );
    }

    // Configure portal session with restricted capabilities
    const configuration = await stripe.billingPortal.configurations.create({
      features: {
        // Users can update payment methods
        payment_method_update: {
          enabled: true,
        },
        // Users can cancel subscriptions
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: ['too_expensive', 'missing_features', 'switched_service', 'other']
          }
        },
        // Users can update their billing address
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'shipping', 'phone', 'tax_id'],
        },
        // Users can view invoices
        invoice_history: {
          enabled: true,
        },
        // Disable plan changes - must go through our UI
        subscription_update: {
          enabled: false,
        },
      },
      business_profile: {
        headline: 'DomainGrab.eu Billing Portal',
      },
    });

    // Create portal session with restricted configuration
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
      configuration: configuration.id,
    });

    const response = NextResponse.json({ url: portalSession.url });
    return securityHeaders(response);
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
});