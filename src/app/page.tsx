'use client';

import { useState } from 'react';
import { Search, Zap, Shield, Globe } from 'lucide-react';
import SearchResults from '@/components/SearchResults';

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean;
  grabScore: number;
  basicIntelligence: {
    length: number;
    hasNumbers: boolean;
    hasHyphens: boolean;
    keywordDensity: number;
    pronounceable: boolean;
    brandable: boolean;
  };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.results || []);
      } else {
        console.error('Search error:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Show search results if user has searched
  if (hasSearched) {
    return (
      <SearchResults
        results={searchResults}
        isLoading={isLoading}
        query={searchQuery}
        onSearch={(newQuery) => {
          setSearchQuery(newQuery);
          handleSearch(newQuery);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Globe className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">DomainGrab</span>
            <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">.eu</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900">Login</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect 
              <span className="text-indigo-600 block">EU Domain</span>
              <span className="text-2xl md:text-3xl font-normal text-gray-600">in Seconds</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              AI-powered domain discovery with GDPR-compliant intelligence. 
              The NameSnag of Europe is here.
            </p>

            {/* Magic Search Box */}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  🔮 Find Your Perfect EU Domain in Seconds
                </h2>
              </div>
              
              <form onSubmit={onFormSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="I need a domain for..."
                    className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                </div>
              </form>

              <div className="text-sm text-gray-500">
                <p>Try: &quot;tech startup in Berlin&quot; or &quot;Dutch e-commerce&quot; or &quot;short brandable .eu&quot;</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-indigo-100 rounded-lg p-3 w-fit mb-4">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Discovery</h3>
              <p className="text-gray-600">
                Natural language search finds hidden gems across all EU/UK TLDs. 
                Claude AI understands your intent and delivers perfect matches.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">GDPR-Compliant Intelligence</h3>
              <p className="text-gray-600">
                Revolutionary WHOIS alternative with rich business insights. 
                Full compliance with European privacy regulations.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">EU Market Optimized</h3>
              <p className="text-gray-600">
                Specialized for European markets with cultural fit analysis 
                and cross-border opportunity detection.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-white rounded-2xl shadow-xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Find Your Domain?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of European entrepreneurs and investors
            </p>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg">
              Start Searching For Free
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="h-6 w-6" />
            <span className="text-xl font-bold">DomainGrab.eu</span>
          </div>
          <p className="text-gray-400">
            The AI-powered domain intelligence platform for EU/UK markets
          </p>
        </div>
      </footer>
    </div>
  );
}