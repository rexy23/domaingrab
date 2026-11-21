import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    },
    stripe: {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceIds: {
        proMonthly: !!process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
        proYearly: !!process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
        businessMonthly: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID,
        businessYearly: !!process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID,
      }
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    nextAuth: {
      url: !!process.env.NEXTAUTH_URL,
      secret: !!process.env.NEXTAUTH_SECRET,
    },
    database: {
      url: !!process.env.DATABASE_URL,
    }
  };

  // Test Stripe connection
  let stripeStatus = 'Not tested';
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      const prices = await stripe.prices.list({ limit: 1 });
      stripeStatus = 'Connected successfully';
    }
  } catch (error) {
    stripeStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  // Test Supabase connection
  let supabaseStatus = 'Not tested';
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error } = await supabase.from('users').select('id').limit(1);
      supabaseStatus = error ? `Error: ${error.message}` : 'Connected successfully';
    }
  } catch (error) {
    supabaseStatus = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  // Check for specific price IDs
  const priceValidation = [];
  if (process.env.STRIPE_SECRET_KEY) {
    const priceIds = [
      { name: 'Pro Monthly', id: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID },
      { name: 'Pro Yearly', id: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID },
      { name: 'Business Monthly', id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID },
      { name: 'Business Yearly', id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID },
    ];

    for (const price of priceIds) {
      if (price.id) {
        try {
          await stripe.prices.retrieve(price.id);
          priceValidation.push({ name: price.name, status: 'Valid' });
        } catch (error) {
          priceValidation.push({ name: price.name, status: 'Invalid or not found' });
        }
      } else {
        priceValidation.push({ name: price.name, status: 'Not configured' });
      }
    }
  }

  return NextResponse.json({
    results,
    connections: {
      stripe: stripeStatus,
      supabase: supabaseStatus,
    },
    priceValidation,
    recommendations: generateRecommendations(results),
  });
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];

  // Check environment variables
  if (!results.environment.appUrl) {
    recommendations.push('Set NEXT_PUBLIC_APP_URL in your .env.local file');
  }

  // Stripe checks
  if (!results.stripe.secretKey) {
    recommendations.push('Add STRIPE_SECRET_KEY to your .env.local file');
  }
  if (!results.stripe.publishableKey) {
    recommendations.push('Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env.local file');
  }
  if (!results.stripe.webhookSecret) {
    recommendations.push('Add STRIPE_WEBHOOK_SECRET to your .env.local file (get from Stripe Dashboard > Webhooks)');
  }

  // Price IDs
  const priceIdChecks = [
    { key: results.stripe.priceIds.proMonthly, name: 'NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID' },
    { key: results.stripe.priceIds.proYearly, name: 'NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID' },
    { key: results.stripe.priceIds.businessMonthly, name: 'NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID' },
    { key: results.stripe.priceIds.businessYearly, name: 'NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID' },
  ];

  priceIdChecks.forEach(check => {
    if (!check.key) {
      recommendations.push(`Add ${check.name} to your .env.local file`);
    }
  });

  // Supabase checks
  if (!results.supabase.url) {
    recommendations.push('Add NEXT_PUBLIC_SUPABASE_URL to your .env.local file');
  }
  if (!results.supabase.anonKey) {
    recommendations.push('Add NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
  }
  if (!results.supabase.serviceKey) {
    recommendations.push('Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  }

  // NextAuth checks
  if (!results.nextAuth.url) {
    recommendations.push('Add NEXTAUTH_URL to your .env.local file');
  }
  if (!results.nextAuth.secret) {
    recommendations.push('Add NEXTAUTH_SECRET to your .env.local file (generate with: openssl rand -base64 32)');
  }

  return recommendations;
}
