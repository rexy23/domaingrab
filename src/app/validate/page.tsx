'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface ValidationResult {
  results: {
    environment: Record<string, boolean>;
    stripe: {
      secretKey: boolean;
      publishableKey: boolean;
      webhookSecret: boolean;
      priceIds: Record<string, boolean>;
    };
    supabase: Record<string, boolean>;
    nextAuth: Record<string, boolean>;
    database: Record<string, boolean>;
  };
  connections: {
    stripe: string;
    supabase: string;
  };
  priceValidation: Array<{ name: string; status: string }>;
  recommendations: string[];
}

export default function ValidatePage() {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateSetup = async () => {
      try {
        const response = await fetch('/api/validate-setup');
        const data = await response.json();
        setValidation(data);
      } catch (error) {
        setError('Failed to validate setup');
        console.error('Validation error:', error);
      } finally {
        setLoading(false);
      }
    };

    validateSetup();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | string }) => {
    if (typeof status === 'boolean') {
      return status ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-500" />
      );
    }
    return status.includes('success') ? (
      <Check className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-yellow-500" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validating your setup...</p>
        </div>
      </div>
    );
  }

  if (error || !validation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load validation data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Setup Validation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check if all your environment variables and services are properly configured
          </p>
        </div>

        {/* Environment Variables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Environment Variables
          </h2>
          
          <div className="space-y-4">
            {/* Stripe */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Stripe</h3>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.stripe.secretKey} />
                  <span className="text-gray-700 dark:text-gray-300">Secret Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.stripe.publishableKey} />
                  <span className="text-gray-700 dark:text-gray-300">Publishable Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.stripe.webhookSecret} />
                  <span className="text-gray-700 dark:text-gray-300">Webhook Secret</span>
                </div>
              </div>
            </div>

            {/* Supabase */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Supabase</h3>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.supabase.url} />
                  <span className="text-gray-700 dark:text-gray-300">URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.supabase.anonKey} />
                  <span className="text-gray-700 dark:text-gray-300">Anon Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.supabase.serviceKey} />
                  <span className="text-gray-700 dark:text-gray-300">Service Role Key</span>
                </div>
              </div>
            </div>

            {/* NextAuth */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">NextAuth</h3>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.nextAuth.url} />
                  <span className="text-gray-700 dark:text-gray-300">URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={validation.results.nextAuth.secret} />
                  <span className="text-gray-700 dark:text-gray-300">Secret</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Connections */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Service Connections
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon status={validation.connections.stripe} />
              <span className="text-gray-700 dark:text-gray-300">
                Stripe: {validation.connections.stripe}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon status={validation.connections.supabase} />
              <span className="text-gray-700 dark:text-gray-300">
                Supabase: {validation.connections.supabase}
              </span>
            </div>
          </div>
        </div>

        {/* Price Validation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Stripe Price IDs
          </h2>
          <div className="space-y-2">
            {validation.priceValidation.map((price, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <StatusIcon status={price.status === 'Valid'} />
                <span className="text-gray-700 dark:text-gray-300">
                  {price.name}: {price.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {validation.recommendations.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
              Recommendations
            </h2>
            <ul className="space-y-2">
              {validation.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-yellow-700 dark:text-yellow-300">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Test Buttons */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/pricing"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Test Pricing Page
          </Link>
          <Link
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}