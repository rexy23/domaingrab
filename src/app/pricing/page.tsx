'use client';

import { useState } from 'react';
import { Check, X, Globe, Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PLANS } from '@/lib/stripe-client';
import { useCSRF } from '@/hooks/useCSRF';

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { csrfToken } = useCSRF();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planKey: string, priceId: string | null) => {
    if (planKey === 'free') {
      router.push('/auth/signup');
      return;
    }

    if (planKey === 'enterprise') {
      router.push('/contact-sales');
      return;
    }

    if (!priceId) {
      return;
    }

    if (!csrfToken) {
      alert('Please wait a moment and try again.');
      return;
    }

    setIsLoading(planKey);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ 
          priceId,
          planType: planKey,
          email: session?.user?.email,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(null);
    }
  };

  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    key,
    ...plan,
    displayPrice: plan.price === null 
      ? 'Custom' 
      : billingInterval === 'yearly' && plan.price > 0
      ? Math.floor(plan.price * 10) // 20% discount for yearly
      : plan.price,
    priceId: billingInterval === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId,
  }));

  return (
    <div className="min-h-screen bg-gradient-luxury">
      {/* Header */}
      <header className="px-6 py-6">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <Globe className="h-10 w-10 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
            <div className="text-3xl font-light text-gray-900">DomainGrab</div>
          </Link>
          {session ? (
            <Link href="/dashboard" className="text-gray-900 hover:text-blue-600 transition-colors font-medium">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signin" className="text-gray-900 hover:text-blue-600 transition-colors font-medium">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-light text-gray-900 mb-4 text-luxury-title">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-luxury-subtitle">
            Start with our free tier or unlock premium features
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-md transition-all duration-200 ${
                billingInterval === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-24">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative bg-white rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-8 flex flex-col ${
                plan.key === 'pro' ? 'ring-2 ring-blue-600' : 'hover:ring-2 hover:ring-blue-200'
              }`}
            >
              {plan.key === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  {typeof plan.displayPrice === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        €{plan.displayPrice}
                      </span>
                      <span className="text-gray-600">
                        /{billingInterval === 'yearly' ? 'year' : 'month'}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-semibold text-gray-900">
                      {plan.displayPrice}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.key, plan.priceId)}
                disabled={isLoading === plan.key}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.key === 'free'
                    ? 'bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 hover:border-blue-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading === plan.key ? (
                  <Loader className="h-5 w-5 animate-spin mx-auto" />
                ) : plan.key === 'enterprise' ? (
                  'Contact Sales'
                ) : (
                  'Get Started'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
            Detailed Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-8 text-gray-900">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.key} className="text-center py-4 px-4 text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Domain Searches', values: ['5/day', '100/day', '1000/day', 'Unlimited'] },
                  { feature: 'Domain Scoring', values: [false, true, true, true] },
                  { feature: 'WHOIS Data', values: [false, true, true, true] },
                  { feature: 'Market Trends', values: [false, false, true, true] },
                  { feature: 'Bulk Operations', values: [false, false, true, true] },
                  { feature: 'API Access', values: [false, false, true, true] },
                  { feature: 'Custom Alerts', values: ['1', '10', '50', 'Unlimited'] },
                  { feature: 'Priority Support', values: [false, false, true, true] },
                  { feature: 'Custom Integration', values: [false, false, false, true] },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-4 pr-8 text-gray-700">{row.feature}</td>
                    {row.values.map((value, planIdx) => (
                      <td key={planIdx} className="text-center py-4 px-4">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-700">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}