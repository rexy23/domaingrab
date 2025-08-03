import { redis } from './redis';
import { ClaudeAI, EnhancedDomainIntelligence, MarketContext } from './claude-ai';
import { WhoisService } from './whois-service';
import { DomainScorer } from './domain-scorer';

export interface DomainResult {
  domain: string;
  tld: string;
  available: boolean;
  grabScore: number;
  scoreExplanation: string[];
  basicIntelligence: {
    length: number;
    hasNumbers: boolean;
    hasHyphens: boolean;
    keywordDensity: number;
    pronounceable: boolean;
    brandable: boolean;
  };
  whoisData?: {
    registrar?: string;
    createdDate?: string;
    expiryDate?: string;
    registrantCountry?: string;
  };
  enhancedIntelligence?: EnhancedDomainIntelligence;
}

export const EU_TLDS = [
  'eu', 'de', 'uk', 'fr', 'nl', 'it', 'es', 'pl', 'be', 'at', 'ch', 'se', 'dk', 'no', 'fi'
];

export class DomainCheckerV2 {
  private readonly cache_ttl = 300; // 5 minutes
  private readonly claudeAI = new ClaudeAI();

  async checkDomain(
    domain: string, 
    useEnhancedAnalysis: boolean = false,
    marketContext?: MarketContext
  ): Promise<DomainResult | null> {
    try {
      const cacheKey = `domain:v2:${domain}`;
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

      // Check real availability using WHOIS
      const whoisResult = await WhoisService.checkDomain(domain);
      
      // Generate basic intelligence
      const basicIntelligence = this.generateBasicIntelligence(domainName);
      
      // Calculate advanced score
      const { score, factors, explanation } = DomainScorer.calculateScore(
        domain,
        whoisResult.available,
        marketContext
      );

      const result: DomainResult = {
        domain,
        tld,
        available: whoisResult.available,
        grabScore: score,
        scoreExplanation: explanation,
        basicIntelligence,
        whoisData: whoisResult.available ? undefined : {
          registrar: whoisResult.registrar,
          createdDate: whoisResult.createdDate,
          expiryDate: whoisResult.expiryDate,
          registrantCountry: whoisResult.registrantCountry,
        },
      };

      // Add enhanced AI analysis if requested and domain is available
      if (useEnhancedAnalysis && whoisResult.available) {
        result.enhancedIntelligence = await this.claudeAI.analyzeDomain(
          domain,
          basicIntelligence,
          marketContext
        );
      }

      // Cache result
      await redis.set(cacheKey, JSON.stringify(result), { ex: this.cache_ttl });

      return result;
    } catch (error) {
      console.error('Error checking domain:', error);
      return null;
    }
  }

  async checkMultipleDomains(
    domains: string[],
    useEnhancedAnalysis: boolean = false,
    marketContext?: MarketContext
  ): Promise<DomainResult[]> {
    // First, get WHOIS data for all domains
    const whoisResults = await WhoisService.checkMultipleDomains(domains);
    
    // Process each domain
    const results: DomainResult[] = [];
    
    for (const domain of domains) {
      const whoisResult = whoisResults.get(domain);
      if (!whoisResult) continue;
      
      const parts = domain.split('.');
      if (parts.length < 2) continue;
      
      const tld = parts[parts.length - 1].toLowerCase();
      const domainName = parts.slice(0, -1).join('.');
      
      if (!EU_TLDS.includes(tld)) continue;
      
      const basicIntelligence = this.generateBasicIntelligence(domainName);
      const { score, factors, explanation } = DomainScorer.calculateScore(
        domain,
        whoisResult.available,
        marketContext
      );
      
      const result: DomainResult = {
        domain,
        tld,
        available: whoisResult.available,
        grabScore: score,
        scoreExplanation: explanation,
        basicIntelligence,
        whoisData: whoisResult.available ? undefined : {
          registrar: whoisResult.registrar,
          createdDate: whoisResult.createdDate,
          expiryDate: whoisResult.expiryDate,
          registrantCountry: whoisResult.registrantCountry,
        },
      };
      
      // Only analyze available domains with AI
      if (useEnhancedAnalysis && whoisResult.available && score >= 70) {
        result.enhancedIntelligence = await this.claudeAI.analyzeDomain(
          domain,
          basicIntelligence,
          marketContext
        );
      }
      
      results.push(result);
    }
    
    // Sort by score
    return results.sort((a, b) => b.grabScore - a.grabScore);
  }

  async generateDomainSuggestions(
    query: string,
    limit: number = 50,
    useEnhancedAnalysis: boolean = false,
    marketContext?: MarketContext
  ): Promise<DomainResult[]> {
    // Generate domain variations based on query
    const suggestions = await this.generateVariations(query, limit * 2);
    
    // Check all domains
    const results = await this.checkMultipleDomains(
      suggestions,
      useEnhancedAnalysis,
      marketContext
    );
    
    // Return only available domains, limited to requested count
    return results
      .filter(r => r.available)
      .slice(0, limit);
  }

  private async generateVariations(query: string, count: number): Promise<string[]> {
    const variations = new Set<string>();
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Direct word combinations
    if (words.length === 1) {
      const word = words[0];
      // Add common prefixes
      ['get', 'my', 'the', 'pro', 'euro', 'eu'].forEach(prefix => {
        EU_TLDS.slice(0, 5).forEach(tld => {
          variations.add(`${prefix}${word}.${tld}`);
        });
      });
      
      // Add common suffixes
      ['hub', 'pro', 'app', 'eu', 'shop', 'zone'].forEach(suffix => {
        EU_TLDS.slice(0, 5).forEach(tld => {
          variations.add(`${word}${suffix}.${tld}`);
        });
      });
      
      // Direct word with different TLDs
      EU_TLDS.forEach(tld => {
        variations.add(`${word}.${tld}`);
      });
    } else {
      // Multiple words - try combinations
      const combined = words.join('');
      const hyphenated = words.join('-');
      
      EU_TLDS.slice(0, 8).forEach(tld => {
        variations.add(`${combined}.${tld}`);
        variations.add(`${hyphenated}.${tld}`);
        
        // Try first + last word
        if (words.length > 2) {
          variations.add(`${words[0]}${words[words.length - 1]}.${tld}`);
        }
      });
    }
    
    // Add some creative variations
    const creativeWords = [
      'smart', 'digital', 'online', 'web', 'cloud', 'tech', 'euro',
      'market', 'trade', 'shop', 'store', 'hub', 'zone', 'space'
    ];
    
    creativeWords.forEach(creative => {
      EU_TLDS.slice(0, 3).forEach(tld => {
        if (words.length === 1) {
          variations.add(`${words[0]}${creative}.${tld}`);
          variations.add(`${creative}${words[0]}.${tld}`);
        }
      });
    });
    
    // Convert to array and limit
    return Array.from(variations).slice(0, count);
  }

  private generateBasicIntelligence(domainName: string) {
    const hasNumbers = /\d/.test(domainName);
    const hasHyphens = /-/.test(domainName);
    const vowels = (domainName.match(/[aeiou]/gi) || []).length;
    const pronounceable = vowels > 0 && (vowels / domainName.length) > 0.2;
    
    // Keyword analysis
    const techKeywords = ['tech', 'app', 'web', 'digital', 'online', 'cloud', 'data', 'ai'];
    const businessKeywords = ['shop', 'store', 'market', 'trade', 'commerce', 'pay'];
    const premiumKeywords = ['pro', 'premium', 'plus', 'elite', 'prime'];
    
    const allKeywords = [...techKeywords, ...businessKeywords, ...premiumKeywords];
    const keywordDensity = allKeywords.filter(word => 
      domainName.toLowerCase().includes(word)
    ).length / allKeywords.length;
    
    const brandable = !hasNumbers && !hasHyphens && pronounceable && 
                     domainName.length >= 4 && domainName.length <= 12;

    return {
      length: domainName.length,
      hasNumbers,
      hasHyphens,
      keywordDensity,
      pronounceable,
      brandable,
    };
  }
}