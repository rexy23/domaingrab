import { useState } from 'react';
import { fetchWithCSRF } from './useCSRF';

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (priceId: string, planKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithCSRF('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, planKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const manageBilling = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithCSRF('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Portal error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    manageBilling,
    isLoading,
    error,
  };
}