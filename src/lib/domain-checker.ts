import { redis } from './redis';

export interface DomainResult {
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

export const EU_TLDS = [
  'eu', 'de', 'uk', 'fr', 'nl', 'it', 'es', 'pl', 'be', 'at', 'ch', 'se', 'dk', 'no', 'fi'
];

export class DomainChecker {
  private readonly cache_ttl = 300; // 5 minutes

  async checkDomain(domain: string): Promise<DomainResult | null> {
    try {
      const cacheKey = `domain:${domain}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached as string);
      }

      // Extract TLD
      const parts = domain.split('.');
      if (parts.length < 2) return null;
      
      const tld = parts[parts.length - 1].toLowerCase();
      const domainName = parts.slice(0, -1).join('.');

      // Check if it's an EU TLD
      if (!EU_TLDS.includes(tld)) {
        return null;
      }

      // Simulate domain availability check (in production, use real WHOIS API)
      const available = await this.simulateAvailabilityCheck(domain);
      
      // Generate basic intelligence
      const basicIntelligence = this.generateBasicIntelligence(domainName);
      
      // Calculate grab score
      const grabScore = this.calculateBasicScore(domainName, tld, available, basicIntelligence);

      const result: DomainResult = {
        domain,
        tld,
        available,
        grabScore,
        basicIntelligence,
      };

      // Cache result
      await redis.set(cacheKey, JSON.stringify(result), { ex: this.cache_ttl });

      return result;
    } catch (error) {
      console.error('Error checking domain:', error);
      return null;
    }
  }

  private async simulateAvailabilityCheck(domain: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate availability (shorter domains more likely to be taken)
    const domainName = domain.split('.')[0];
    const lengthFactor = Math.min(domainName.length / 10, 1);
    const randomFactor = Math.random();
    
    return lengthFactor * randomFactor > 0.3;
  }

  private generateBasicIntelligence(domainName: string) {
    const hasNumbers = /\d/.test(domainName);
    const hasHyphens = /-/.test(domainName);
    const vowels = (domainName.match(/[aeiou]/gi) || []).length;
    const pronounceable = vowels > 0 && (vowels / domainName.length) > 0.2;
    
    // Simple keyword density (how common the words might be)
    const commonWords = ['tech', 'app', 'web', 'digital', 'online', 'shop', 'store', 'market'];
    const keywordDensity = commonWords.some(word => domainName.toLowerCase().includes(word)) ? 0.8 : 0.3;
    
    const brandable = !hasNumbers && !hasHyphens && pronounceable && domainName.length >= 4 && domainName.length <= 12;

    return {
      length: domainName.length,
      hasNumbers,
      hasHyphens,
      keywordDensity,
      pronounceable,
      brandable,
    };
  }

  private calculateBasicScore(
    domainName: string, 
    tld: string, 
    available: boolean, 
    intelligence: {
      length: number;
      hasNumbers: boolean;
      hasHyphens: boolean;
      keywordDensity: number;
      pronounceable: boolean;
      brandable: boolean;
    }
  ): number {
    let score = 50; // Base score

    // Availability boost
    if (available) score += 20;

    // Length scoring (sweet spot 6-10 characters)
    if (intelligence.length >= 6 && intelligence.length <= 10) {
      score += 15;
    } else if (intelligence.length >= 4 && intelligence.length <= 12) {
      score += 10;
    } else if (intelligence.length < 4) {
      score += 25; // Short domains are premium
    } else {
      score -= 10; // Too long
    }

    // Brandability
    if (intelligence.brandable) score += 15;
    if (intelligence.pronounceable) score += 10;
    
    // Penalize numbers and hyphens
    if (intelligence.hasNumbers) score -= 10;
    if (intelligence.hasHyphens) score -= 15;

    // TLD preferences (EU focus)
    const tldBonus: Record<string, number> = {
      'eu': 15,
      'de': 12,
      'uk': 12,
      'fr': 10,
      'nl': 10,
      'it': 8,
      'es': 8,
    };
    score += tldBonus[tld] || 5;

    // Keyword density
    score += Math.floor(intelligence.keywordDensity * 15);

    // Ensure score is between 1-100
    return Math.max(1, Math.min(100, Math.floor(score)));
  }

  async generateDomainSuggestions(query: string, maxResults = 50): Promise<DomainResult[]> {
    const suggestions = this.generateDomainVariations(query);
    const results: DomainResult[] = [];

    // Check domains in batches to avoid overwhelming APIs
    for (let i = 0; i < suggestions.length && results.length < maxResults; i += 5) {
      const batch = suggestions.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(domain => this.checkDomain(domain))
      );
      
      results.push(...batchResults.filter(Boolean) as DomainResult[]);
    }

    // Sort by grab score (highest first)
    return results.sort((a, b) => b.grabScore - a.grabScore);
  }

  private generateDomainVariations(query: string): string[] {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const words = cleanQuery.split(/\s+/).filter(Boolean);
    const variations: string[] = [];

    if (words.length === 0) return [];

    // Single word variations
    if (words.length === 1) {
      const word = words[0];
      EU_TLDS.forEach(tld => {
        variations.push(`${word}.${tld}`);
        variations.push(`${word}app.${tld}`);
        variations.push(`${word}tech.${tld}`);
        variations.push(`${word}hub.${tld}`);
        variations.push(`get${word}.${tld}`);
        variations.push(`my${word}.${tld}`);
      });
    }

    // Multi-word variations
    if (words.length >= 2) {
      EU_TLDS.forEach(tld => {
        // Concatenated
        variations.push(`${words.join('')}.${tld}`);
        // With hyphens
        variations.push(`${words.join('-')}.${tld}`);
        // First two words
        variations.push(`${words[0]}${words[1]}.${tld}`);
        // Acronym
        if (words.length <= 4) {
          variations.push(`${words.map(w => w[0]).join('')}.${tld}`);
        }
      });
    }

    // Remove duplicates and invalid domains
    return [...new Set(variations)].filter(domain => {
      const name = domain.split('.')[0];
      return name.length >= 2 && name.length <= 63;
    });
  }
}