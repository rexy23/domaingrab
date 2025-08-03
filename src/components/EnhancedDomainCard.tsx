'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Star, Globe, Clock, ExternalLink, TrendingUp, 
  Shield, Zap, Brain, AlertTriangle, CheckCircle, 
  BarChart3, Users, Building
} from 'lucide-react';

interface BasicIntelligence {
  length: number;
  hasNumbers: boolean;
  hasHyphens: boolean;
  keywordDensity: number;
  pronounceable: boolean;
  brandable: boolean;
}

interface EnhancedIntelligence {
  grabScore: number;
  brandability: {
    score: number;
    reasoning: string;
    brandPotential: 'high' | 'medium' | 'low';
  };
  marketFit: {
    score: number;
    targetMarkets: string[];
    culturalRelevance: string;
    localizedAppeal: number;
  };
  businessPotential: {
    score: number;
    suggestedIndustries: string[];
    monetizationPotential: string;
    competitiveAdvantage: string;
  };
  linguisticAnalysis: {
    pronounceability: number;
    memorability: number;
    crossLanguageAppeal: number;
    phoneticHarmonics: string;
  };
  riskAssessment: {
    trademarkRisk: 'low' | 'medium' | 'high';
    typoSquattingRisk: number;
    brandingConflicts: string[];
    legalConsiderations: string;
  };
  confidence: number;
}

interface DomainHistory {
  waybackData?: {
    archiveCount: number;
    firstSeen?: string;
    lastSeen?: string;
  };
  backlinkProfile?: {
    totalBacklinks: number;
    referringDomains: number;
    qualityScore: number;
  };
  businessIntelligence?: {
    previousBusiness?: {
      name: string;
      industry: string;
      status: 'active' | 'inactive' | 'unknown';
    };
  };
}

interface EnhancedDomainCardProps {
  domain: string;
  tld: string;
  available: boolean;
  basicIntelligence: BasicIntelligence;
  onAnalyze?: (domain: string) => void;
}

export default function EnhancedDomainCard({ 
  domain, 
  tld, 
  available, 
  basicIntelligence,
  onAnalyze 
}: EnhancedDomainCardProps) {
  const [enhancedIntelligence, setEnhancedIntelligence] = useState<EnhancedIntelligence | null>(null);
  const [domainHistory, setDomainHistory] = useState<DomainHistory | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'history'>('overview');
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const basicScore = calculateBasicScore();

  function calculateBasicScore(): number {
    let score = 50;
    if (available) score += 20;
    if (basicIntelligence.length >= 6 && basicIntelligence.length <= 10) score += 15;
    if (basicIntelligence.brandable) score += 15;
    if (basicIntelligence.pronounceable) score += 10;
    if (basicIntelligence.hasNumbers) score -= 10;
    if (basicIntelligence.hasHyphens) score -= 15;
    return Math.max(1, Math.min(100, score));
  }

  const loadEnhancedAnalysis = async () => {
    if (enhancedIntelligence || isLoadingEnhanced) return;
    
    setIsLoadingEnhanced(true);
    try {
      const response = await fetch('/api/domain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          basicIntelligence,
          marketContext: { query: 'tech startup' } // TODO: Get from context
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setEnhancedIntelligence(data.analysis);
      }
    } catch (error) {
      console.error('Failed to load enhanced analysis:', error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  const loadDomainHistory = async () => {
    if (domainHistory || isLoadingHistory) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/domain/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomainHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load domain history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analysis' && !enhancedIntelligence) {
      loadEnhancedAnalysis();
    }
    if (activeTab === 'history' && !domainHistory) {
      loadDomainHistory();
    }
  }, [activeTab]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  const currentScore = enhancedIntelligence?.grabScore || basicScore;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-gray-900">{domain}</h3>
              {available ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Taken
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(currentScore)}`}>
                {isLoadingEnhanced && activeTab === 'analysis' ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  `GrabScore: ${currentScore}/100`
                )}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Length:</span>
                <span className="ml-1 font-medium">{basicIntelligence.length} chars</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Type:</span>
                <span className="ml-1 font-medium">
                  {basicIntelligence.brandable ? 'Brandable' : 
                   basicIntelligence.pronounceable ? 'Pronounceable' : 'Generic'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">TLD:</span>
                <span className="ml-1 font-medium">.{tld}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Quality:</span>
                <span className="ml-1 font-medium">
                  {!basicIntelligence.hasNumbers && !basicIntelligence.hasHyphens ? 'Clean' : 'Mixed'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 ml-6">
            {available ? (
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
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'analysis', label: 'AI Analysis', icon: Brain },
            { id: 'history', label: 'History', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Feature Tags */}
            <div className="flex flex-wrap gap-2">
              {basicIntelligence.brandable && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Brandable
                </span>
              )}
              {basicIntelligence.pronounceable && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Pronounceable
                </span>
              )}
              {basicIntelligence.keywordDensity > 0.5 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Keyword Rich
                </span>
              )}
              {basicIntelligence.length <= 6 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Short & Sweet
                </span>
              )}
            </div>

            {/* Basic Score Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Score Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Length (6-10 chars):</span>
                  <span className={basicIntelligence.length >= 6 && basicIntelligence.length <= 10 ? 'text-green-600' : 'text-gray-600'}>
                    {basicIntelligence.length >= 6 && basicIntelligence.length <= 10 ? '+15' : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Brandable:</span>
                  <span className={basicIntelligence.brandable ? 'text-green-600' : 'text-gray-600'}>
                    {basicIntelligence.brandable ? '+15' : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Clean (no numbers/hyphens):</span>
                  <span className={!basicIntelligence.hasNumbers && !basicIntelligence.hasHyphens ? 'text-green-600' : 'text-red-600'}>
                    {!basicIntelligence.hasNumbers && !basicIntelligence.hasHyphens ? '+0' : '-10'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>TLD (.{tld}):</span>
                  <span className="text-blue-600">+5</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {isLoadingEnhanced ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">AI analyzing domain potential...</p>
              </div>
            ) : enhancedIntelligence ? (
              <>
                {/* AI Confidence */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-indigo-900">AI Analysis Confidence: {enhancedIntelligence.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${enhancedIntelligence.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Analysis Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Brandability */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium">Brandability</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getScoreColor(enhancedIntelligence.brandability.score)}`}>
                        {enhancedIntelligence.brandability.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{enhancedIntelligence.brandability.reasoning}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      enhancedIntelligence.brandability.brandPotential === 'high' ? 'bg-green-100 text-green-800' :
                      enhancedIntelligence.brandability.brandPotential === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {enhancedIntelligence.brandability.brandPotential} potential
                    </span>
                  </div>

                  {/* Market Fit */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">Market Fit</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getScoreColor(enhancedIntelligence.marketFit.score)}`}>
                        {enhancedIntelligence.marketFit.score}/100
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Target Markets:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {enhancedIntelligence.marketFit.targetMarkets.map(market => (
                            <span key={market} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {market}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cultural Relevance:</span>
                        <p className="text-gray-700">{enhancedIntelligence.marketFit.culturalRelevance}</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Potential */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">Business Potential</h4>
                      <span className={`px-2 py-1 rounded text-xs ${getScoreColor(enhancedIntelligence.businessPotential.score)}`}>
                        {enhancedIntelligence.businessPotential.score}/100
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Suggested Industries:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {enhancedIntelligence.businessPotential.suggestedIndustries.map(industry => (
                            <span key={industry} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {industry}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Monetization:</span>
                        <p className="text-gray-700">{enhancedIntelligence.businessPotential.monetizationPotential}</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium">Risk Assessment</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Trademark Risk:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getRiskColor(enhancedIntelligence.riskAssessment.trademarkRisk)}`}>
                          {enhancedIntelligence.riskAssessment.trademarkRisk}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Typo-squatting Risk:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getScoreColor(100 - enhancedIntelligence.riskAssessment.typoSquattingRisk)}`}>
                          {enhancedIntelligence.riskAssessment.typoSquattingRisk}/100
                        </span>
                      </div>
                      {enhancedIntelligence.riskAssessment.legalConsiderations && (
                        <div>
                          <span className="text-gray-500">Legal Notes:</span>
                          <p className="text-gray-700">{enhancedIntelligence.riskAssessment.legalConsiderations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Click to get AI-powered analysis</p>
                <button 
                  onClick={loadEnhancedAnalysis}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Analyze with AI
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading domain history...</p>
              </div>
            ) : domainHistory ? (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Wayback Data */}
                {domainHistory.waybackData && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">Archive History</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Archives:</span>
                        <span className="font-medium">{domainHistory.waybackData.archiveCount}</span>
                      </div>
                      {domainHistory.waybackData.firstSeen && (
                        <div className="flex justify-between">
                          <span>First Seen:</span>
                          <span className="font-medium">
                            {new Date(domainHistory.waybackData.firstSeen).getFullYear()}
                          </span>
                        </div>
                      )}
                      {domainHistory.waybackData.lastSeen && (
                        <div className="flex justify-between">
                          <span>Last Seen:</span>
                          <span className="font-medium">
                            {new Date(domainHistory.waybackData.lastSeen).getFullYear()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Backlink Profile */}
                {domainHistory.backlinkProfile && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">Backlink Profile</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Backlinks:</span>
                        <span className="font-medium">{domainHistory.backlinkProfile.totalBacklinks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Referring Domains:</span>
                        <span className="font-medium">{domainHistory.backlinkProfile.referringDomains.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Score:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getScoreColor(domainHistory.backlinkProfile.qualityScore)}`}>
                          {domainHistory.backlinkProfile.qualityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Intelligence */}
                {domainHistory.businessIntelligence?.previousBusiness && (
                  <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium">Previous Business</h4>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Company:</span>
                        <p className="font-medium">{domainHistory.businessIntelligence.previousBusiness.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <p className="font-medium">{domainHistory.businessIntelligence.previousBusiness.industry}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          domainHistory.businessIntelligence.previousBusiness.status === 'active' ? 'bg-green-100 text-green-800' :
                          domainHistory.businessIntelligence.previousBusiness.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {domainHistory.businessIntelligence.previousBusiness.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Click to load domain history</p>
                <button 
                  onClick={loadDomainHistory}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Load History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}