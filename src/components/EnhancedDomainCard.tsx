'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Star, Globe, Clock, ExternalLink, TrendingUp, 
  Shield, Zap, Brain, CheckCircle, 
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
}

export default function EnhancedDomainCard({ 
  domain, 
  tld, 
  available, 
  basicIntelligence
}: EnhancedDomainCardProps) {
  const [enhancedIntelligence, setEnhancedIntelligence] = useState<EnhancedIntelligence | null>(null);
  const [domainHistory, setDomainHistory] = useState<DomainHistory | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'history'>('overview');
  // const [showFullAnalysis, setShowFullAnalysis] = useState(false);

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

  const loadEnhancedAnalysis = useCallback(async () => {
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
  }, [domain, basicIntelligence, enhancedIntelligence, isLoadingEnhanced]);

  const loadDomainHistory = useCallback(async () => {
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
  }, [domain, domainHistory, isLoadingHistory]);

  useEffect(() => {
    if (activeTab === 'analysis' && !enhancedIntelligence) {
      loadEnhancedAnalysis();
    }
    if (activeTab === 'history' && !domainHistory) {
      loadDomainHistory();
    }
  }, [activeTab, enhancedIntelligence, domainHistory, loadEnhancedAnalysis, loadDomainHistory]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-fair';
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'score-excellent';
      case 'medium': return 'score-good';
      case 'high': return 'score-fair';
    }
  };

  const currentScore = enhancedIntelligence?.grabScore || basicScore;

  return (
    <div className="card-luxury">
      {/* Luxury Header */}
      <div className="pb-6 border-b border-blue-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-2xl font-light text-charcoal text-luxury-title">{domain}</h3>
              {available ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  <Clock className="w-4 h-4 mr-2" />
                  Reserved
                </span>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(currentScore)}`}>
                {isLoadingEnhanced && activeTab === 'analysis' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  `Score: ${currentScore}/100`
                )}
              </span>
            </div>

            {/* Luxury Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-light text-blue-600 mb-1">{basicIntelligence.length}</div>
                <div className="text-sm text-charcoal/60 uppercase tracking-wide">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-charcoal mb-1">
                  {basicIntelligence.brandable ? 'Brandable' : 
                   basicIntelligence.pronounceable ? 'Pronounceable' : 'Generic'}
                </div>
                <div className="text-sm text-charcoal/60 uppercase tracking-wide">Type</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium text-blue-600 mb-1">.{tld.toUpperCase()}</div>
                <div className="text-sm text-charcoal/60 uppercase tracking-wide">Extension</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-charcoal mb-1">
                  {!basicIntelligence.hasNumbers && !basicIntelligence.hasHyphens ? 'Premium' : 'Standard'}
                </div>
                <div className="text-sm text-charcoal/60 uppercase tracking-wide">Quality</div>
              </div>
            </div>

            {/* Luxury Feature Tags */}
            {(basicIntelligence.brandable || basicIntelligence.pronounceable || basicIntelligence.keywordDensity > 0.5 || basicIntelligence.length <= 6) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {basicIntelligence.brandable && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                    ✨ Brandable
                  </span>
                )}
                {basicIntelligence.pronounceable && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100">
                    🗣️ Pronounceable
                  </span>
                )}
                {basicIntelligence.keywordDensity > 0.5 && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100">
                    🎯 Keyword Rich
                  </span>
                )}
                {basicIntelligence.length <= 6 && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-100">
                    💎 Premium Short
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Luxury Action Buttons */}
          <div className="flex flex-col gap-3 ml-8">
            {available ? (
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 px-6 py-3">
                <ExternalLink className="h-4 w-4" />
                Acquire
              </button>
            ) : (
              <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors flex items-center gap-2 px-6 py-3">
                <Clock className="h-4 w-4" />
                Monitor
              </button>
            )}
            <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors flex items-center gap-2 px-6 py-3">
              <Star className="h-4 w-4" />
              Curate
            </button>
          </div>
        </div>
      </div>

      {/* Luxury Tabs */}
      <div className="border-b border-blue-100 mt-8">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'analysis', label: 'AI Analysis', icon: Brain },
            { id: 'history', label: 'Intelligence', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'overview' | 'analysis' | 'history')}
              className={`flex items-center gap-3 px-8 py-4 text-sm font-medium border-b-3 transition-all duration-300 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-charcoal/60 hover:text-blue-500 hover:border-blue-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-luxury-subtitle">{label}</span>
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
                          {enhancedIntelligence.marketFit.targetMarkets.map((market: string) => (
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