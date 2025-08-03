'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Globe, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const setupToken = searchParams.get('setup_token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!sessionId || !setupToken) {
        setError('Invalid checkout session');
        setIsLoading(false);
        return;
      }

      try {
        // Check if this is a new user who needs to set up their password
        const response = await fetch(`/api/auth/check-setup-token?token=${setupToken}`);
        const data = await response.json();

        if (response.ok && data.needsSetup) {
          setIsNewUser(true);
          // Redirect to setup password page after a brief moment
          setTimeout(() => {
            router.push(`/auth/setup-password?token=${setupToken}`);
          }, 2000);
        } else if (response.status === 404 && retryCount < 3) {
          // Token not found yet, webhook might still be processing
          // Retry after a delay
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
          return; // Don't set loading to false yet
        } else if (response.status === 404) {
          // After initial retries, try the fallback method
          console.log('Attempting fallback user creation...');
          
          const fallbackResponse = await fetch('/api/auth/create-pending-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              setupToken,
            }),
          });

          const fallbackData = await fallbackResponse.json();

          if (fallbackResponse.ok && fallbackData.needsSetup) {
            setIsNewUser(true);
            setTimeout(() => {
              router.push(`/auth/setup-password?token=${setupToken}`);
            }, 2000);
          } else {
            setError('Account creation failed. Please contact support with your order details.');
          }
        } else {
          // Existing user, redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking user status:', err);
        if (retryCount < 5) {
          // Retry on network errors
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
          return;
        }
        setError('Failed to process checkout. Please try refreshing the page.');
      } finally {
        if (retryCount >= 5 || error) {
          setIsLoading(false);
        }
      }
    };

    checkUserStatus();
  }, [sessionId, setupToken, router, retryCount]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="card-luxury">
            <p className="text-red-600">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-luxury flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="relative">
              <Globe className="h-10 w-10 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
            <span className="text-3xl font-light text-gray-900 text-luxury-title">DomainGrab</span>
          </Link>
          <h1 className="text-4xl text-luxury-title text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-900/70 text-luxury-subtitle">
            Thank you for your subscription
          </p>
        </div>

        <div className="card-luxury">
          <div className="text-center space-y-4">
            {isLoading ? (
              <>
                <Loader className="h-16 w-16 text-blue-500 animate-spin mx-auto" />
                <p className="text-gray-600">
                  {retryCount > 0 
                    ? `Setting up your account... (${retryCount}/3)`
                    : 'Processing your subscription...'}
                </p>
                {retryCount > 2 && (
                  <p className="text-sm text-gray-500 mt-2">
                    This is taking a bit longer than usual. Please wait...
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600">
                  {isNewUser
                    ? "Your account is being created..."
                    : "Redirecting you to your dashboard..."}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {isNewUser
                    ? "You'll be able to set your password in just a moment."
                    : "Please wait while we complete your login."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}