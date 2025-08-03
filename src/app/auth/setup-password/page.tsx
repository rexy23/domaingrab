'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Globe, Lock, User, CheckCircle } from 'lucide-react';
import { fetchWithCSRF } from '@/hooks/useCSRF';

export default function SetupPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid setup link');
        return;
      }

      try {
        const response = await fetch(`/api/auth/check-setup-token?token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.needsSetup) {
          setError('Invalid or expired setup link');
          return;
        }

        setUserEmail(data.email);
      } catch (err) {
        console.error('Error verifying token:', err);
        setError('Failed to verify setup link');
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Set up the password
      const response = await fetchWithCSRF('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to set up password');
        return;
      }

      setIsSuccess(true);

      // Automatically sign in the user
      const signInResult = await signIn('credentials', {
        email: userEmail,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        // If auto sign-in fails, redirect to sign-in page
        setTimeout(() => {
          router.push('/auth/signin?setup=complete');
        }, 2000);
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
            <h1 className="text-4xl text-luxury-title text-gray-900 mb-2">Account Created!</h1>
          </div>

          <div className="card-luxury">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                Your account has been set up successfully. Signing you in...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-luxury flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="relative">
              <Globe className="h-10 w-10 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
            <span className="text-3xl font-light text-gray-900 text-luxury-title">DomainGrab</span>
          </Link>
          <h1 className="text-4xl text-luxury-title text-gray-900 mb-2">Complete Your Account</h1>
          <p className="text-gray-900/70 text-luxury-subtitle">
            Set up your password to access your new subscription
          </p>
        </div>

        <div className="card-luxury">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {userEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={userEmail}
                    className="input-luxury pl-10 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-luxury pl-10"
                  placeholder="••••••••"
                  required
                  disabled={!userEmail}
                />
              </div>
              <p className="mt-1 text-sm text-gray-600">Must be at least 8 characters long</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-luxury pl-10"
                  placeholder="••••••••"
                  required
                  disabled={!userEmail}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !userEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}