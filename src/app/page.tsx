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
    <div className="min-h-screen bg-gradient-luxury">
      {/* Header */}
      <header className="px-6 py-6">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Globe className="h-10 w-10 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            </div>
            <div>
              <span className="text-3xl font-light text-gray-900 text-luxury-title">DomainGrab</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full ml-2 font-medium">.eu</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-900 hover:text-blue-600 transition-colors font-medium">
              Sign In
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-6xl md:text-7xl text-luxury-title text-gray-900 mb-8">
              Discover Your Perfect
              <span className="text-blue-500 block bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                European Domain
              </span>
              <span className="text-3xl md:text-4xl font-light text-gray-900/70 block mt-4">
                with AI-Powered Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-900/80 mb-16 max-w-4xl mx-auto text-luxury-subtitle">
              Experience the future of domain discovery. Our GDPR-compliant platform combines 
              artificial intelligence with European market expertise to find you the perfect digital identity.
            </p>

            {/* Luxury Search Box */}
            <div className="card-luxury max-w-5xl mx-auto mb-12">
              <div className="mb-8">
                <h2 className="text-2xl text-luxury-subtitle text-gray-900 mb-3">
                  ✨ Your Domain Journey Begins Here
                </h2>
                <p className="text-gray-900/60 text-luxury-subtitle">
                  Describe your vision, and let our AI curate the perfect domains for you
                </p>
              </div>
              
              <form onSubmit={onFormSubmit} className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="I need a domain for my luxury boutique in Paris..."
                    className="input-luxury text-lg"
                  />
                  <button
                    type="submit"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors py-3 px-6"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Discover
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
                  &quot;luxury fashion in Milan&quot;
                </span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
                  &quot;German tech startup&quot;
                </span>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
                  &quot;short brandable .eu&quot;
                </span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-10 mb-24">
            <div className="card-luxury text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-luxury-subtitle text-gray-900 mb-4">
                AI-Powered Discovery
              </h3>
              <p className="text-gray-900/70 text-luxury-subtitle leading-relaxed">
                Our Claude AI understands context, culture, and market dynamics 
                to surface domains that perfectly match your European ambitions.
              </p>
            </div>

            <div className="card-luxury text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-luxury-subtitle text-gray-900 mb-4">
                Privacy-First Intelligence
              </h3>
              <p className="text-gray-900/70 text-luxury-subtitle leading-relaxed">
                Revolutionary WHOIS alternative with full GDPR compliance. 
                Rich insights without compromising European privacy standards.
              </p>
            </div>

            <div className="card-luxury text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sapphire to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl text-luxury-subtitle text-gray-900 mb-4">
                European Market Mastery
              </h3>
              <p className="text-gray-900/70 text-luxury-subtitle leading-relaxed">
                Specialized for EU/UK markets with cultural analysis, 
                regulatory insights, and cross-border opportunity detection.
              </p>
            </div>
          </div>

          {/* Luxury CTA Section */}
          <div className="text-center">
            <div className="card-luxury max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50">
              <div className="text-center">
                <h2 className="text-4xl text-luxury-title text-gray-900 mb-6">
                  Begin Your Digital Legacy
                </h2>
                <p className="text-xl text-gray-900/70 mb-10 text-luxury-subtitle max-w-2xl mx-auto">
                  Join Europe&apos;s most discerning entrepreneurs and investors 
                  in discovering domains that define excellence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-lg px-10 py-4">
                    Start Your Journey
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors-outline text-lg px-10 py-4">
                    View Pricing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Luxury Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-blue-50 py-16 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Globe className="h-8 w-8 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"></div>
              </div>
              <span className="text-2xl font-light text-luxury-title">DomainGrab.eu</span>
            </div>
            <p className="text-blue-100/80 text-luxury-subtitle max-w-2xl mx-auto">
              The AI-powered domain intelligence platform crafted for Europe&apos;s digital elite. 
              Where sophistication meets innovation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <h4 className="text-blue-300 font-medium mb-4">Platform</h4>
              <div className="space-y-2 text-blue-100/70">
                <p>Domain Search</p>
                <p>AI Analysis</p>
                <p>Portfolio Tracker</p>
                <p>Smart Alerts</p>
              </div>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-4">Markets</h4>
              <div className="space-y-2 text-blue-100/70">
                <p>United Kingdom</p>
                <p>Germany</p>
                <p>France</p>
                <p>Netherlands</p>
              </div>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-4">Company</h4>
              <div className="space-y-2 text-blue-100/70">
                <p>About Us</p>
                <a href="/privacy-policy" className="block hover:text-blue-100 transition-colors">Privacy Policy</a>
                <a href="/cookie-preferences" className="block hover:text-blue-100 transition-colors">Cookie Preferences</a>
                <p>Terms of Service</p>
                <p>Contact</p>
              </div>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-4">Connect</h4>
              <div className="space-y-2 text-blue-100/70">
                <p>LinkedIn</p>
                <p>Twitter</p>
                <p>Newsletter</p>
                <p>Support</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-12 pt-8 text-center">
            <p className="text-blue-100/50 text-sm">
              © 2024 DomainGrab.eu. Crafted with precision in Europe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}