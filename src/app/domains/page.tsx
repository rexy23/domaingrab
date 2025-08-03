'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Search, TrendingUp, Calendar, Shield, Star, ExternalLink, Trash2, Plus, Filter, Download } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';

interface SavedDomain {
  id: string;
  domain: string;
  score: number;
  status: 'available' | 'taken' | 'watching';
  addedAt: string;
  expiresAt?: string;
  notes?: string;
  tags?: string[];
  lastChecked: string;
  priceHistory?: { date: string; price: number }[];
  alerts?: { type: string; enabled: boolean }[];
}

export default function DomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { csrfToken } = useCSRF();
  
  const [domains, setDomains] = useState<SavedDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'taken' | 'watching'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Load user's domains
    loadDomains();
  }, [session, status, router]);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      // Mock data for now
      const mockDomains: SavedDomain[] = [
        {
          id: '1',
          domain: 'technovate.io',
          score: 92,
          status: 'available',
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          tags: ['tech', 'startup'],
          priceHistory: [
            { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), price: 49 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), price: 45 },
            { date: new Date().toISOString(), price: 39 },
          ],
        },
        {
          id: '2',
          domain: 'cloudspace.com',
          score: 88,
          status: 'taken',
          addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['cloud', 'saas'],
          notes: 'Premium domain, monitor for expiry',
          alerts: [
            { type: 'expiry', enabled: true },
            { type: 'price_drop', enabled: true },
          ],
        },
        {
          id: '3',
          domain: 'dataforge.ai',
          score: 95,
          status: 'watching',
          addedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          lastChecked: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          tags: ['ai', 'data'],
          notes: 'Expires soon, high value domain',
        },
      ];
      
      setDomains(mockDomains);
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain from your watchlist?')) {
      return;
    }

    try {
      // API call would go here
      setDomains(domains.filter(d => d.id !== domainId));
    } catch (error) {
      console.error('Failed to delete domain:', error);
    }
  };

  const exportDomains = () => {
    const csv = [
      ['Domain', 'Score', 'Status', 'Added Date', 'Last Checked', 'Tags', 'Notes'].join(','),
      ...domains.map(d => [
        d.domain,
        d.score,
        d.status,
        new Date(d.addedAt).toLocaleDateString(),
        new Date(d.lastChecked).toLocaleDateString(),
        d.tags?.join(';') || '',
        d.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredDomains = domains
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  d.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.domain.localeCompare(b.domain);
        case 'date':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-luxury">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-light text-gray-900">DomainGrab</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-gray-600 hover:text-blue-600 transition-colors">
                Search
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/alerts" className="text-gray-600 hover:text-blue-600 transition-colors">
                Alerts
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">My Domains</h1>
          <p className="text-gray-600">Track and manage your domain watchlist</p>
        </div>

        {/* Toolbar */}
        <div className="card-luxury mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search domains or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Domains</option>
                <option value="available">Available</option>
                <option value="taken">Taken</option>
                <option value="watching">Watching</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Latest First</option>
                <option value="score">Highest Score</option>
                <option value="name">Alphabetical</option>
              </select>
              <button
                onClick={exportDomains}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <Link
                href="/search"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Domain
              </Link>
            </div>
          </div>
        </div>

        {/* Domains List */}
        {filteredDomains.length > 0 ? (
          <div className="grid gap-4">
            {filteredDomains.map((domain) => (
              <div key={domain.id} className="card-luxury hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {domain.domain}
                      </h3>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        domain.status === 'available' 
                          ? 'bg-green-100 text-green-700'
                          : domain.status === 'taken'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {domain.status === 'watching' ? 'Watching' : domain.status}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{domain.score}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Added {new Date(domain.addedAt).toLocaleDateString()}
                      </span>
                      <span>
                        Last checked {new Date(domain.lastChecked).toLocaleString()}
                      </span>
                      {domain.expiresAt && (
                        <span className="text-orange-600">
                          Expires {new Date(domain.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {domain.tags && domain.tags.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {domain.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {domain.notes && (
                      <p className="text-sm text-gray-600 italic">📝 {domain.notes}</p>
                    )}

                    {domain.priceHistory && domain.priceHistory.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Current price: </span>
                        <span className="font-semibold text-green-600">
                          ${domain.priceHistory[domain.priceHistory.length - 1].price}
                        </span>
                        {domain.priceHistory.length > 1 && (
                          <span className="text-gray-500 ml-2">
                            (was ${domain.priceHistory[0].price})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex gap-2">
                    <a
                      href={`https://www.whois.com/whois/${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="View WHOIS"
                    >
                      <Shield className="h-5 w-5" />
                    </a>
                    <a
                      href={`https://${domain.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Visit domain"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => deleteDomain(domain.id)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-luxury text-center py-12">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your domain portfolio by searching for available domains.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
              Search Domains
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}