'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Globe, Search, TrendingUp, Bell, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gradient-luxury">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <div className="relative">
                <Globe className="h-8 w-8 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              </div>
              <span className="text-2xl font-light text-gray-900">DomainGrab</span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
                Search
              </Link>
              <Link href="/domains" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Domains
              </Link>
              <Link href="/alerts" className="text-gray-700 hover:text-blue-600 transition-colors">
                Alerts
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl text-luxury-title text-gray-900 mb-2">
            Welcome back, {session.user.name || session.user.email}!
          </h1>
          <p className="text-gray-600">
            Your subscription: <span className="font-semibold capitalize">{session.user.subscriptionTier}</span> plan
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/search" className="card-luxury hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Search Domains</h3>
                <p className="text-gray-600 text-sm">Find your perfect domain with AI-powered search</p>
              </div>
            </div>
          </Link>

          <Link href="/domains" className="card-luxury hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Domain Analytics</h3>
                <p className="text-gray-600 text-sm">Track performance and value of your domains</p>
              </div>
            </div>
          </Link>

          <Link href="/alerts" className="card-luxury hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Set Alerts</h3>
                <p className="text-gray-600 text-sm">Get notified when domains become available</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card-luxury">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-600">No recent activity yet. Start by searching for domains!</p>
          </div>
        </div>
      </main>
    </div>
  );
}