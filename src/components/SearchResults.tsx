'use client';

import { useState } from 'react';
import { Search, Star, Globe, Clock, ExternalLink } from 'lucide-react';

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAvailabilityBadge = (available: boolean) => {
    return available ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Taken
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">DomainGrab</span>
              <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">.eu</span>
            </div>
            <div className="flex-1 relative max-w-2xl">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for domains..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for perfect domains...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results for &quot;{query}&quot;
              </h2>
              <p className="text-gray-600">
                Found {results.length} domains. Sorted by GrabScore.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4">
              {results.map((result) => (
                <div
                  key={result.domain}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Domain Name & Availability */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {result.domain}
                        </h3>
                        {getAvailabilityBadge(result.available)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.grabScore)}`}>
                          GrabScore: {result.grabScore}/100
                        </span>
                      </div>

                      {/* Domain Intelligence */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-500">Length:</span>
                          <span className="ml-1 font-medium">{result.basicIntelligence.length} chars</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 font-medium">
                            {result.basicIntelligence.brandable ? 'Brandable' : 
                             result.basicIntelligence.pronounceable ? 'Pronounceable' : 'Generic'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">TLD:</span>
                          <span className="ml-1 font-medium">.{result.tld}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Quality:</span>
                          <span className="ml-1 font-medium">
                            {!result.basicIntelligence.hasNumbers && !result.basicIntelligence.hasHyphens ? 'Clean' : 'Mixed'}
                          </span>
                        </div>
                      </div>

                      {/* Feature Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.basicIntelligence.brandable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Brandable
                          </span>
                        )}
                        {result.basicIntelligence.pronounceable && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Pronounceable
                          </span>
                        )}
                        {result.basicIntelligence.keywordDensity > 0.5 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Keyword Rich
                          </span>
                        )}
                        {result.basicIntelligence.length <= 6 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Short & Sweet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-6">
                      {result.available ? (
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Register
                        </button>
                      ) : (
                        <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Watch
                        </button>
                      )}
                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Score Breakdown:</span>
                      <div className="flex items-center gap-4">
                        <span>Length: {result.basicIntelligence.length <= 8 ? '+' : '-'}</span>
                        <span>Clean: {!result.basicIntelligence.hasNumbers && !result.basicIntelligence.hasHyphens ? '+' : '-'}</span>
                        <span>Brandable: {result.basicIntelligence.brandable ? '+' : '-'}</span>
                        <span>TLD: .{result.tld}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {results.length >= 50 && (
              <div className="text-center mt-8">
                <button className="bg-indigo-100 text-indigo-700 px-6 py-3 rounded-lg hover:bg-indigo-200">
                  Load More Results
                </button>
              </div>
            )}
          </>
        ) : query ? (
          <div className="text-center py-12">
            <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or exploring different keywords.
            </p>
            <button
              onClick={() => onSearch('tech startup')}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Try &quot;tech startup&quot; instead
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-600">
              Enter keywords to find the perfect EU domain for your project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}