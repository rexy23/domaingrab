import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export const PRICE_IDS = {
  free: null,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  business: process.env.STRIPE_BUSINESS_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'EUR',
    interval: null,
    features: [
      '10 searches per day',
      'Basic domain scores',
      'Monthly email alerts',
    ],
    searchLimit: 10,
    alertFrequency: 'monthly',
  },
  pro: {
    name: 'Pro',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unlimited searches',
      'Full domain intelligence',
      'Daily email alerts',
      'API access (1,000 calls/month)',
      'Priority support',
    ],
    searchLimit: -1,
    alertFrequency: 'daily',
    apiLimit: 1000,
  },
  business: {
    name: 'Business',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Bulk operations',
      'White-label reports',
      'API access (10,000 calls/month)',
      'Priority support',
      'Custom branding',
    ],
    searchLimit: -1,
    alertFrequency: 'daily',
    apiLimit: 10000,
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Everything in Business',
      'Custom scoring models',
      'Dedicated infrastructure',
      'Unlimited API access',
      'SLA guarantee',
      'Custom integrations',
    ],
    searchLimit: -1,
    alertFrequency: 'realtime',
    apiLimit: -1,
  },
} as const;