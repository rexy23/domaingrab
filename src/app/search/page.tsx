'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, Search, Loader, CheckCircle, XCircle, TrendingUp, Calendar, Shield, Star, ArrowRight, Filter } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';

interface DomainResult {
  domain: string;
  available: boolean;
  score: number;
  price?: string;
  registrar?: string;
  expires?: string;
  age?: number;
  da?: number; // Domain Authority
  backlinks?: number;
  traffic?: number;
  brandability?: 'high' | 'medium' | 'low';
  keywords?: string[];
  similar?: string[];
}

export default function SearchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { csrfToken } = useCSRF();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tld: 'all',
    maxPrice: '',
    minScore: 0,
  });

  // Handle query parameter on mount
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      // Automatically perform search
      handleSearchWithQuery(query);
    }
  }, [searchParams]);

  const handleSearchWithQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          query: query,
          enhanced: session?.user ? true : false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Transform API results to match our UI format
      const transformedResults = (data.results || []).map((result: any) => ({
        domain: result.domain,
        available: result.available,
        score: result.grabScore,
        price: result.enhancedIntelligence?.pricingRecommendation?.estimatedValue?.toFixed(2),
        registrar: result.whoisData?.registrar,
        expires: result.whoisData?.expiryDate,
        age: result.whoisData?.createdDate ? 
          Math.floor((Date.now() - new Date(result.whoisData.createdDate).getTime()) / (365 * 24 * 60 * 60 * 1000)) : 
          undefined,
        da: result.enhancedIntelligence?.seoScore,
        backlinks: Math.floor(Math.random() * 10000), // Mock for now
        traffic: Math.floor(Math.random() * 50000), // Mock for now
        brandability: result.enhancedIntelligence?.brandability || 
          (result.grabScore > 80 ? 'high' : result.grabScore > 60 ? 'medium' : 'low'),
        keywords: result.basicIntelligence?.keywords || [],
        similar: result.enhancedIntelligence?.competitorAnalysis?.similarDomains || [],
      }));
      
      setResults(transformedResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchWithQuery(searchQuery);
  };

  const saveToWatchlist = async (domain: string) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch('/api/domains/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        alert(`${domain} added to your watchlist!`);
      }
    } catch (err) {
      console.error('Failed to save domain:', err);
    }
  };

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
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/domains" className="text-gray-600 hover:text-blue-600 transition-colors">
                My Domains
              </Link>
              <Link href="/alerts" className="text-gray-600 hover:text-blue-600 transition-colors">
                Alerts
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            Find Your Perfect Domain
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Search, analyze, and grab premium domains with AI-powered insights
          </p>

          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords, brand name, or domain idea..."
                className="w-full px-6 py-4 pr-32 text-lg rounded-full border border-gray-300 focus:border-blue-500 focus:outline-none shadow-sm"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Search
              </button>
            </div>
          </form>

          {/* Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 mx-auto"
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
          </button>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm max-w-3xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TLD</label>
                  <select
                    value={filters.tld}
                    onChange={(e) => setFilters({ ...filters, tld: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All TLDs</option>
                    <optgroup label="European Union - General">
                      <option value=".eu">🇪🇺 .eu - European Union</option>
                      <option value=".de">🇩🇪 .de - Germany</option>
                      <option value=".fr">🇫🇷 .fr - France</option>
                      <option value=".it">🇮🇹 .it - Italy</option>
                      <option value=".es">🇪🇸 .es - Spain</option>
                      <option value=".nl">🇳🇱 .nl - Netherlands</option>
                      <option value=".be">🇧🇪 .be - Belgium</option>
                      <option value=".at">🇦🇹 .at - Austria</option>
                      <option value=".pl">🇵🇱 .pl - Poland</option>
                      <option value=".pt">🇵🇹 .pt - Portugal</option>
                      <option value=".gr">🇬🇷 .gr - Greece</option>
                      <option value=".se">🇸🇪 .se - Sweden</option>
                      <option value=".dk">🇩🇰 .dk - Denmark</option>
                      <option value=".fi">🇫🇮 .fi - Finland</option>
                      <option value=".cz">🇨🇿 .cz - Czech Republic</option>
                      <option value=".hu">🇭🇺 .hu - Hungary</option>
                      <option value=".ro">🇷🇴 .ro - Romania</option>
                      <option value=".bg">🇧🇬 .bg - Bulgaria</option>
                      <option value=".hr">🇭🇷 .hr - Croatia</option>
                      <option value=".sk">🇸🇰 .sk - Slovakia</option>
                      <option value=".si">🇸🇮 .si - Slovenia</option>
                      <option value=".lt">🇱🇹 .lt - Lithuania</option>
                      <option value=".lv">🇱🇻 .lv - Latvia</option>
                      <option value=".ee">🇪🇪 .ee - Estonia</option>
                      <option value=".lu">🇱🇺 .lu - Luxembourg</option>
                      <option value=".mt">🇲🇹 .mt - Malta</option>
                      <option value=".cy">🇨🇾 .cy - Cyprus</option>
                      <option value=".ie">🇮🇪 .ie - Ireland</option>
                    </optgroup>
                    <optgroup label="EU Government Domains">
                      <option value=".europa.eu">🇪🇺 .europa.eu - EU Institutions</option>
                      <option value=".bund.de">🇩🇪 .bund.de - German Federal Gov</option>
                      <option value=".gouv.fr">🇫🇷 .gouv.fr - French Government</option>
                      <option value=".gov.it">🇮🇹 .gov.it - Italian Government</option>
                      <option value=".gob.es">🇪🇸 .gob.es - Spanish Government</option>
                      <option value=".overheid.nl">🇳🇱 .overheid.nl - Dutch Government</option>
                      <option value=".belgium.be">🇧🇪 .belgium.be - Belgian Federal</option>
                      <option value=".gv.at">🇦🇹 .gv.at - Austrian Government</option>
                      <option value=".gov.pl">🇵🇱 .gov.pl - Polish Government</option>
                      <option value=".gov.pt">🇵🇹 .gov.pt - Portuguese Government</option>
                      <option value=".gov.gr">🇬🇷 .gov.gr - Greek Government</option>
                      <option value=".regeringen.se">🇸🇪 .regeringen.se - Swedish Gov</option>
                      <option value=".dk">🇩🇰 .dk - Danish Government</option>
                      <option value=".valtioneuvosto.fi">🇫🇮 .valtioneuvosto.fi - Finnish Gov</option>
                      <option value=".vlada.cz">🇨🇿 .vlada.cz - Czech Government</option>
                      <option value=".kormany.hu">🇭🇺 .kormany.hu - Hungarian Gov</option>
                      <option value=".gov.ro">🇷🇴 .gov.ro - Romanian Government</option>
                      <option value=".government.bg">🇧🇬 .government.bg - Bulgarian Gov</option>
                      <option value=".gov.hr">🇭🇷 .gov.hr - Croatian Government</option>
                      <option value=".gov.sk">🇸🇰 .gov.sk - Slovak Government</option>
                      <option value=".gov.si">🇸🇮 .gov.si - Slovenian Government</option>
                      <option value=".lrv.lt">🇱🇹 .lrv.lt - Lithuanian Government</option>
                      <option value=".gov.lv">🇱🇻 .gov.lv - Latvian Government</option>
                      <option value=".valitsus.ee">🇪🇪 .valitsus.ee - Estonian Gov</option>
                      <option value=".public.lu">🇱🇺 .public.lu - Luxembourg Gov</option>
                      <option value=".gov.mt">🇲🇹 .gov.mt - Maltese Government</option>
                      <option value=".gov.cy">🇨🇾 .gov.cy - Cyprus Government</option>
                      <option value=".gov.ie">🇮🇪 .gov.ie - Irish Government</option>
                    </optgroup>
                    <optgroup label="United Kingdom">
                      <option value=".uk">🇬🇧 .uk - United Kingdom</option>
                      <option value=".co.uk">🇬🇧 .co.uk - UK Commercial</option>
                      <option value=".org.uk">🇬🇧 .org.uk - UK Organization</option>
                      <option value=".gov.uk">🇬🇧 .gov.uk - UK Government</option>
                      <option value=".ac.uk">🇬🇧 .ac.uk - UK Academic</option>
                      <option value=".nhs.uk">🇬🇧 .nhs.uk - UK Health Service</option>
                      <option value=".police.uk">🇬🇧 .police.uk - UK Police</option>
                      <option value=".mod.uk">🇬🇧 .mod.uk - UK Defence</option>
                    </optgroup>
                    <optgroup label="Other Popular">
                      <option value=".com">.com - Commercial</option>
                      <option value=".net">.net - Network</option>
                      <option value=".org">.org - Organization</option>
                      <option value=".io">.io - Tech/Startup</option>
                      <option value=".ai">.ai - AI/Tech</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="Any price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{filters.minScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-3xl mx-auto">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Found {results.length} domains
            </h2>

            <div className="grid gap-6">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="card-luxury hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {result.domain}
                        </h3>
                        {result.available ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle className="h-4 w-4" />
                            Taken
                          </span>
                        )}
                        {result.brandability && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.brandability === 'high' 
                              ? 'bg-green-100 text-green-700'
                              : result.brandability === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {result.brandability} brandability
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">
                            Score: <strong>{result.score}/100</strong>
                          </span>
                        </div>
                        {result.da && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600">
                              DA: <strong>{result.da}</strong>
                            </span>
                          </div>
                        )}
                        {result.age && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {result.age} years old
                            </span>
                          </div>
                        )}
                        {result.backlinks && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-gray-600">
                              {result.backlinks.toLocaleString()} backlinks
                            </span>
                          </div>
                        )}
                      </div>

                      {result.keywords && result.keywords.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">Keywords: </span>
                          {result.keywords.map((keyword, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full mr-2 mb-1">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}

                      {result.similar && result.similar.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Similar available: </span>
                          {result.similar.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 text-right">
                      {result.price && (
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          ${result.price}
                        </div>
                      )}
                      {result.available ? (
                        <div className="space-y-2">
                          <a
                            href={`https://www.namecheap.com/domains/registration/results/?domain=${result.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Register
                            <ArrowRight className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => saveToWatchlist(result.domain)}
                            className="block w-full text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Add to Watchlist
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => saveToWatchlist(result.domain)}
                            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Watch Domain
                          </button>
                          {result.expires && (
                            <p className="text-sm text-gray-500">
                              Expires: {new Date(result.expires).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && searchQuery && !error && (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No results found. Try different keywords!</p>
          </div>
        )}
      </main>
    </div>
  );
}