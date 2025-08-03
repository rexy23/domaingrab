import { redis } from './redis';

export interface TrademarkResult {
  domain: string;
  riskLevel: 'low' | 'medium' | 'high';
  conflicts: TrademarkConflict[];
  recommendations: string[];
  confidence: number;
  lastChecked: Date;
}

export interface TrademarkConflict {
  trademark: string;
  owner: string;
  jurisdiction: string;
  classes: string[];
  status: 'active' | 'pending' | 'expired';
  similarity: number; // 0-100
  riskFactors: string[];
}

export interface EUTrademarkDatabase {
  euipo: boolean; // EU Intellectual Property Office
  wipo: boolean;  // World Intellectual Property Organization
  national: string[]; // National trademark offices
}

export class TrademarkChecker {
  private readonly databases: EUTrademarkDatabase = {
    euipo: true,
    wipo: true,
    national: ['DE', 'UK', 'FR', 'IT', 'ES', 'NL', 'PL']
  };

  async checkTrademarks(domain: string): Promise<TrademarkResult> {
    const cacheKey = `trademark:${domain}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached as string);
    }

    const domainName = domain.split('.')[0].toLowerCase();
    const conflicts: TrademarkConflict[] = [];

    try {
      // Check against multiple databases
      const [euipoResults, wipoResults, nationalResults] = await Promise.allSettled([
        this.checkEUIPI(domainName),
        this.checkWIPO(domainName),
        this.checkNationalDatabases(domainName)
      ]);

      if (euipoResults.status === 'fulfilled') {
        conflicts.push(...euipoResults.value);
      }

      if (wipoResults.status === 'fulfilled') {
        conflicts.push(...wipoResults.value);
      }

      if (nationalResults.status === 'fulfilled') {
        conflicts.push(...nationalResults.value);
      }

      // Analyze risk level
      const riskLevel = this.calculateRiskLevel(conflicts);
      const recommendations = this.generateRecommendations(conflicts, riskLevel);
      const confidence = this.calculateConfidence(conflicts.length);

      const result: TrademarkResult = {
        domain,
        riskLevel,
        conflicts: conflicts.slice(0, 10), // Limit to top 10 conflicts
        recommendations,
        confidence,
        lastChecked: new Date()
      };

      // Cache for 24 hours
      await redis.set(cacheKey, JSON.stringify(result), { ex: 24 * 60 * 60 });

      return result;
    } catch (error) {
      console.error('Trademark check error:', error);
      return this.getFallbackResult(domain);
    }
  }

  private async checkEUIPI(domainName: string): Promise<TrademarkConflict[]> {
    // In production, integrate with EUIPO API
    // For now, simulate trademark checking with common patterns
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay

    const conflicts: TrademarkConflict[] = [];
    
    // Simulate checking against common trademarks
    const commonTrademarks = [
      { name: 'apple', owner: 'Apple Inc.', classes: ['09', '42'], similarity: 90 },
      { name: 'google', owner: 'Google LLC', classes: ['09', '35', '42'], similarity: 95 },
      { name: 'amazon', owner: 'Amazon Technologies Inc.', classes: ['09', '35', '42'], similarity: 90 },
      { name: 'microsoft', owner: 'Microsoft Corporation', classes: ['09', '42'], similarity: 88 },
      { name: 'facebook', owner: 'Meta Platforms Inc.', classes: ['09', '35', '42'], similarity: 92 }
    ];

    for (const tm of commonTrademarks) {
      const similarity = this.calculateSimilarity(domainName, tm.name);
      
      if (similarity > 70) {
        conflicts.push({
          trademark: tm.name,
          owner: tm.owner,
          jurisdiction: 'EU',
          classes: tm.classes,
          status: 'active',
          similarity,
          riskFactors: this.identifyRiskFactors(domainName, tm.name, similarity)
        });
      }
    }

    return conflicts;
  }

  private async checkWIPO(domainName: string): Promise<TrademarkConflict[]> {
    // Simulate WIPO Global Brand Database check
    await new Promise(resolve => setTimeout(resolve, 300));

    const conflicts: TrademarkConflict[] = [];
    
    // Check for international trademarks
    if (domainName.includes('tech') || domainName.includes('app')) {
      conflicts.push({
        trademark: 'TechApp',
        owner: 'Tech Solutions Global',
        jurisdiction: 'International',
        classes: ['09', '42'],
        status: 'active',
        similarity: 65,
        riskFactors: ['Similar industry focus', 'Common terminology']
      });
    }

    return conflicts;
  }

  private async checkNationalDatabases(domainName: string): Promise<TrademarkConflict[]> {
    // Simulate checking national trademark databases
    await new Promise(resolve => setTimeout(resolve, 150));

    const conflicts: TrademarkConflict[] = [];

    // Check German trademark patterns
    if (domainName.includes('gmbh') || domainName.includes('ag')) {
      conflicts.push({
        trademark: domainName.replace(/gmbh|ag/g, '').trim(),
        owner: 'German Company',
        jurisdiction: 'DE',
        classes: ['35'],
        status: 'active',
        similarity: 80,
        riskFactors: ['Corporate suffix similarity']
      });
    }

    return conflicts;
  }

  private calculateSimilarity(domain: string, trademark: string): number {
    // Simple similarity calculation (in production, use more sophisticated algorithms)
    const domainLower = domain.toLowerCase();
    const trademarkLower = trademark.toLowerCase();

    // Exact match
    if (domainLower === trademarkLower) return 100;

    // Contains check
    if (domainLower.includes(trademarkLower) || trademarkLower.includes(domainLower)) {
      return 85;
    }

    // Levenshtein distance approximation
    const maxLength = Math.max(domainLower.length, trademarkLower.length);
    const minLength = Math.min(domainLower.length, trademarkLower.length);
    
    if (maxLength === 0) return 100;

    // Simple character overlap
    let commonChars = 0;
    for (let i = 0; i < minLength; i++) {
      if (domainLower[i] === trademarkLower[i]) {
        commonChars++;
      }
    }

    return Math.floor((commonChars / maxLength) * 100);
  }

  private identifyRiskFactors(domain: string, trademark: string, similarity: number): string[] {
    const factors: string[] = [];

    if (similarity > 90) {
      factors.push('Very high similarity');
    } else if (similarity > 80) {
      factors.push('High similarity');
    }

    if (domain.includes(trademark)) {
      factors.push('Contains trademark');
    }

    if (domain.length === trademark.length) {
      factors.push('Same length');
    }

    const domainChars = domain.split('').sort();
    const trademarkChars = trademark.split('').sort();
    if (domainChars.join('') === trademarkChars.join('')) {
      factors.push('Anagram');
    }

    return factors;
  }

  private calculateRiskLevel(conflicts: TrademarkConflict[]): 'low' | 'medium' | 'high' {
    if (conflicts.length === 0) return 'low';

    const highRiskConflicts = conflicts.filter(c => 
      c.similarity > 85 && c.status === 'active'
    );

    const mediumRiskConflicts = conflicts.filter(c => 
      c.similarity > 70 && c.status === 'active'
    );

    if (highRiskConflicts.length > 0) return 'high';
    if (mediumRiskConflicts.length > 2) return 'high';
    if (mediumRiskConflicts.length > 0) return 'medium';

    return 'low';
  }

  private generateRecommendations(conflicts: TrademarkConflict[], riskLevel: 'low' | 'medium' | 'high'): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'high':
        recommendations.push('❌ High trademark risk - Consider alternative domain');
        recommendations.push('🏛️ Consult IP attorney before proceeding');
        recommendations.push('🔍 Conduct professional trademark clearance search');
        break;

      case 'medium':
        recommendations.push('⚠️ Moderate risk - Proceed with caution');
        recommendations.push('📋 Consider trademark coexistence analysis');
        recommendations.push('🎯 Focus on different market segments/classes');
        break;

      case 'low':
        recommendations.push('✅ Low trademark risk detected');
        recommendations.push('📝 Standard due diligence recommended');
        recommendations.push('🔄 Monitor for new trademark applications');
        break;
    }

    if (conflicts.length > 0) {
      recommendations.push(`🔍 Review ${conflicts.length} potential conflict${conflicts.length > 1 ? 's' : ''}`);
    }

    recommendations.push('🌍 Check country-specific trademark databases for target markets');

    return recommendations;
  }

  private calculateConfidence(conflictCount: number): number {
    // Confidence decreases with more conflicts found
    if (conflictCount === 0) return 95;
    if (conflictCount <= 2) return 85;
    if (conflictCount <= 5) return 75;
    return 65;
  }

  private getFallbackResult(domain: string): TrademarkResult {
    return {
      domain,
      riskLevel: 'medium',
      conflicts: [],
      recommendations: [
        '⚠️ Trademark check service unavailable',
        '🏛️ Manual trademark search recommended',
        '📞 Consult IP attorney before domain registration'
      ],
      confidence: 30,
      lastChecked: new Date()
    };
  }

  async batchCheckTrademarks(domains: string[]): Promise<Map<string, TrademarkResult>> {
    const results = new Map<string, TrademarkResult>();
    
    // Process in batches to avoid overwhelming APIs
    const batchSize = 5;
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(domain => 
        this.checkTrademarks(domain).then(result => ({ domain, result }))
      );

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ domain, result }) => {
        results.set(domain, result);
      });

      // Rate limiting delay between batches
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  async getTrademarkStats(): Promise<{
    totalChecks: number;
    highRiskDomains: number;
    mediumRiskDomains: number;
    lowRiskDomains: number;
    avgConfidence: number;
  }> {
    // This would typically query from a database
    // For now, return mock stats
    return {
      totalChecks: 1250,
      highRiskDomains: 125,
      mediumRiskDomains: 375,
      lowRiskDomains: 750,
      avgConfidence: 82
    };
  }
}