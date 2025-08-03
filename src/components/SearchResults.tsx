'use client';

import { useState } from 'react';
import { Search, Globe } from 'lucide-react';
import EnhancedDomainCard from './EnhancedDomainCard';

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

interface SearchResultsProps {
  results: DomainResult[];
  isLoading: boolean;
  query: string;
  onSearch: (query: string) => void;
}

export default function SearchResults({ results, isLoading, query, onSearch }: SearchResultsProps) {
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  // Utility functions moved to EnhancedDomainCard component

  return (
    <div className="min-h-screen bg-gradient-luxury">
      {/* Luxury Search Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-luxury border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <form onSubmit={handleSearch} className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="h-8 w-8 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              </div>
              <div>
                <span className="text-2xl font-light text-charcoal text-luxury-title">DomainGrab</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 font-medium">.eu</span>
              </div>
            </div>
            <div className="flex-1 relative max-w-3xl">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Refine your search..."
                className="input-luxury"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors py-2 px-4"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative">
              <div className="animate-spin h-12 w-12 border-3 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-charcoal/70 text-luxury-subtitle">Curating exceptional domains for you...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Luxury Results Header */}
            <div className="mb-12">
              <div className="text-center">
                <h2 className="text-4xl text-luxury-title text-charcoal mb-4">
                  Your Domain Collection
                </h2>
                <p className="text-xl text-charcoal/70 text-luxury-subtitle mb-2">
                  Curated results for &quot;{query}&quot;
                </p>
                <div className="flex justify-center items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {results.length} exceptional domains discovered
                  </span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Luxury Results Grid */}
            <div className="space-y-8">
              {results.map((result) => (
                <EnhancedDomainCard
                  key={result.domain}
                  domain={result.domain}
                  tld={result.tld}
                  available={result.available}
                  basicIntelligence={result.basicIntelligence}
                />
              ))}
            </div>

            {/* Luxury Load More Button */}
            {results.length >= 50 && (
              <div className="text-center mt-16">
                <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors px-8 py-4">
                  Discover More Domains
                </button>
              </div>
            )}
          </>
        ) : query ? (
          <div className="text-center py-20">
            <div className="card-luxury max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-8 flex items-center justify-center">
                <Globe className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl text-luxury-title text-charcoal mb-4">
                No Domains Found
              </h3>
              <p className="text-charcoal/70 text-luxury-subtitle mb-8 leading-relaxed">
                We couldn&apos;t find domains matching your criteria. Try adjusting your search 
                or exploring different keywords to discover your perfect domain.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => onSearch('luxury boutique')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors mr-4"
                >
                  Try &quot;luxury boutique&quot;
                </button>
                <button
                  onClick={() => onSearch('tech startup')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors"
                >
                  Try &quot;tech startup&quot;
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="card-luxury max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-8 flex items-center justify-center">
                <Search className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl text-luxury-title text-charcoal mb-4">
                Begin Your Search
              </h3>
              <p className="text-charcoal/70 text-luxury-subtitle leading-relaxed">
                Enter your vision above to discover domains that will define 
                your digital presence in the European market.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}