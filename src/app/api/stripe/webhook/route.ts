import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks = [];
  const reader = req.body?.getReader();
  
  if (!reader) {
    throw new Error('No body reader available');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  
  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // TODO: Update user subscription in database
        console.log('Checkout completed:', {
          customerId: session.customer,
          subscriptionId: session.subscription,
          userId: session.metadata?.userId,
          planKey: session.metadata?.planKey,
        });
        
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // TODO: Update subscription status in database
        console.log('Subscription updated:', {
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
        });
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // TODO: Handle subscription cancellation
        console.log('Subscription cancelled:', {
          customerId: subscription.customer,
        });
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // TODO: Handle failed payment
        console.log('Payment failed:', {
          customerId: invoice.customer,
        });
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}