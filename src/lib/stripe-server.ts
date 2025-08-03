import Stripe from 'stripe';

// This file should only be imported in server-side code
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});