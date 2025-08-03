// Mock data service for development when external APIs are not available

export interface MockDomainData {
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

export class MockDomainService {
  private static readonly tlds = ['.com', '.net', '.org', '.io', '.ai', '.app', '.dev', '.co'];
  private static readonly registrars = ['GoDaddy', 'Namecheap', 'Google Domains', 'Cloudflare', 'Gandi'];
  
  static generateMockResults(query: string, count: number = 10): MockDomainData[] {
    const results: MockDomainData[] = [];
    const baseQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Generate variations
    const variations = [
      baseQuery,
      `${baseQuery}app`,
      `${baseQuery}hub`,
      `${baseQuery}io`,
      `${baseQuery}ai`,
      `get${baseQuery}`,
      `${baseQuery}now`,
      `${baseQuery}pro`,
      `my${baseQuery}`,
      `the${baseQuery}`,
      `${baseQuery}ly`,
      `${baseQuery}ify`,
      `super${baseQuery}`,
      `${baseQuery}zone`,
      `${baseQuery}lab`,
    ];
    
    for (let i = 0; i < Math.min(count, variations.length); i++) {
      const variation = variations[i];
      const tld = this.tlds[Math.floor(Math.random() * this.tlds.length)];
      const domain = `${variation}${tld}`;
      
      // Randomly determine availability (70% available)
      const available = Math.random() > 0.3;
      
      // Generate realistic scores based on domain quality
      const lengthScore = Math.max(0, 100 - (variation.length - 6) * 5);
      const tldScore = tld === '.com' ? 100 : tld === '.io' ? 85 : tld === '.ai' ? 90 : 70;
      const brandScore = this.calculateBrandability(variation);
      const score = Math.round((lengthScore + tldScore + brandScore) / 3);
      
      const result: MockDomainData = {
        domain,
        available,
        score,
        brandability: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
        keywords: this.extractKeywords(variation),
      };
      
      if (available) {
        // Add pricing for available domains
        const basePrice = tld === '.com' ? 12 : tld === '.ai' ? 100 : tld === '.io' ? 35 : 15;
        const premiumMultiplier = score > 85 ? 10 : score > 75 ? 3 : 1;
        result.price = (basePrice * premiumMultiplier).toFixed(2);
        
        // Add similar available domains
        result.similar = variations
          .slice(i + 1, i + 4)
          .map(v => `${v}${tld}`)
          .filter(() => Math.random() > 0.5);
      } else {
        // Add data for taken domains
        result.registrar = this.registrars[Math.floor(Math.random() * this.registrars.length)];
        result.age = Math.floor(Math.random() * 20) + 1;
        result.expires = new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 2).toISOString();
        result.da = Math.floor(Math.random() * 50) + 10;
        result.backlinks = Math.floor(Math.random() * 10000) + 100;
        result.traffic = Math.floor(Math.random() * 50000);
      }
      
      results.push(result);
    }
    
    // Sort by score
    return results.sort((a, b) => b.score - a.score);
  }
  
  private static calculateBrandability(domain: string): number {
    let score = 100;
    
    // Length penalty
    if (domain.length > 12) score -= 20;
    if (domain.length > 15) score -= 20;
    
    // Pronounceability (simple check)
    const vowels = domain.match(/[aeiou]/gi)?.length || 0;
    const consonants = domain.match(/[bcdfghjklmnpqrstvwxyz]/gi)?.length || 0;
    const ratio = vowels / (consonants || 1);
    if (ratio < 0.3 || ratio > 0.7) score -= 15;
    
    // Check for numbers
    if (/\d/.test(domain)) score -= 25;
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(domain)) score -= 20;
    
    // Bonus for short memorable domains
    if (domain.length <= 6) score += 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private static extractKeywords(domain: string): string[] {
    const commonWords = ['app', 'hub', 'io', 'ai', 'get', 'now', 'pro', 'my', 'the', 'ly', 'ify', 'super', 'zone', 'lab'];
    const keywords: string[] = [];
    
    // Extract base word
    let base = domain;
    for (const word of commonWords) {
      if (domain.startsWith(word)) {
        keywords.push(word);
        base = domain.substring(word.length);
      } else if (domain.endsWith(word)) {
        keywords.push(word);
        base = domain.substring(0, domain.length - word.length);
      }
    }
    
    if (base && base.length > 2) {
      keywords.push(base);
    }
    
    // Add some related keywords based on common patterns
    if (domain.includes('tech')) keywords.push('technology', 'software');
    if (domain.includes('shop')) keywords.push('ecommerce', 'store');
    if (domain.includes('cloud')) keywords.push('saas', 'hosting');
    if (domain.includes('data')) keywords.push('analytics', 'database');
    
    return [...new Set(keywords)].slice(0, 5);
  }
  
  static async checkAvailability(domain: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock availability check - 70% chance of being available
    return Math.random() > 0.3;
  }
  
  static async getWhoisData(domain: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isAvailable = await this.checkAvailability(domain);
    
    if (isAvailable) {
      return { available: true };
    }
    
    return {
      available: false,
      registrar: this.registrars[Math.floor(Math.random() * this.registrars.length)],
      createdDate: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      registrantCountry: ['US', 'UK', 'CA', 'AU', 'DE', 'FR'][Math.floor(Math.random() * 6)],
    };
  }
  
  static async getDomainAuthority(domain: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      domainAuthority: Math.floor(Math.random() * 50) + 10,
      pageAuthority: Math.floor(Math.random() * 40) + 5,
      backlinks: Math.floor(Math.random() * 10000) + 100,
      linkingDomains: Math.floor(Math.random() * 1000) + 10,
      spamScore: Math.floor(Math.random() * 30),
    };
  }
}