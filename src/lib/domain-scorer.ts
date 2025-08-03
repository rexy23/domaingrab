interface ScoringFactors {
  length: number;
  hasNumbers: boolean;
  hasHyphens: boolean;
  pronounceable: boolean;
  brandable: boolean;
  keywordValue: number;
  tldValue: number;
  marketDemand: number;
  memorability: number;
  typingEase: number;
}

interface MarketContext {
  targetCountry?: string;
  industry?: string;
  competitors?: string[];
}

export class DomainScorer {
  private static readonly TLD_SCORES: Record<string, number> = {
    'com': 100,
    'eu': 95,
    'de': 90,
    'uk': 90,
    'fr': 85,
    'nl': 85,
    'it': 85,
    'es': 85,
    'be': 80,
    'ch': 80,
    'at': 80,
    'pl': 75,
    'se': 75,
    'dk': 75,
    'no': 75,
    'io': 85,
    'ai': 80,
    'co': 75,
    'org': 70,
    'net': 65,
    'info': 50,
    'biz': 45,
  };

  private static readonly VALUABLE_KEYWORDS = [
    // Tech
    'tech', 'app', 'cloud', 'data', 'ai', 'crypto', 'web', 'digital', 'smart', 'cyber',
    // Business
    'shop', 'store', 'market', 'trade', 'invest', 'finance', 'pay', 'money', 'cash', 'bank',
    // European markets
    'euro', 'europe', 'eu', 'deutsch', 'france', 'italia', 'espana', 'polska',
    // Premium
    'premium', 'luxury', 'elite', 'pro', 'plus', 'max', 'prime', 'gold', 'platinum',
  ];

  static calculateScore(
    domain: string, 
    available: boolean,
    marketContext?: MarketContext
  ): { score: number; factors: ScoringFactors; explanation: string[] } {
    const [name, tld] = domain.split('.');
    
    const factors: ScoringFactors = {
      length: this.scoreLengt(name),
      hasNumbers: /\d/.test(name),
      hasHyphens: name.includes('-'),
      pronounceable: this.isPronounceabl(name),
      brandable: this.isBrandabl(name),
      keywordValue: this.scoreKeywords(name),
      tldValue: this.TLD_SCORES[tld] || 40,
      marketDemand: this.scoreMarketDemand(name, marketContext),
      memorability: this.scoreMemorability(name),
      typingEase: this.scoreTypingEase(name),
    };

    // Calculate weighted score
    let score = 0;
    const explanation: string[] = [];

    // Base availability score
    if (!available) {
      score = 0;
      explanation.push('Domain is not available');
      return { score, factors, explanation };
    }

    // Length score (25% weight)
    score += factors.length * 0.25;
    if (name.length <= 6) {
      explanation.push(`Short domain (${name.length} chars) - highly valuable`);
    } else if (name.length <= 10) {
      explanation.push(`Good length (${name.length} chars)`);
    }

    // TLD score (20% weight)
    score += (factors.tldValue / 100) * 20;
    if (factors.tldValue >= 90) {
      explanation.push(`Premium TLD (.${tld})`);
    }

    // Brandability (20% weight)
    if (factors.brandable) {
      score += 20;
      explanation.push('Highly brandable name');
    } else if (factors.pronounceable) {
      score += 10;
      explanation.push('Easy to pronounce');
    }

    // Clean name bonus (15% weight)
    if (!factors.hasNumbers && !factors.hasHyphens) {
      score += 15;
      explanation.push('Clean name (no numbers or hyphens)');
    } else {
      if (factors.hasNumbers) score -= 5;
      if (factors.hasHyphens) score -= 5;
    }

    // Keyword value (10% weight)
    if (factors.keywordValue > 0) {
      score += Math.min(factors.keywordValue, 10);
      explanation.push('Contains valuable keywords');
    }

    // Market demand (10% weight)
    score += (factors.marketDemand / 100) * 10;
    if (factors.marketDemand >= 80) {
      explanation.push('High market demand');
    }

    // Additional factors
    score += (factors.memorability / 100) * 5;
    score += (factors.typingEase / 100) * 5;

    // Ensure score is between 0-100
    score = Math.min(Math.max(Math.round(score), 0), 100);

    return { score, factors, explanation };
  }

  private static scoreLengt(name: string): number {
    const len = name.length;
    if (len <= 3) return 100;
    if (len <= 4) return 95;
    if (len <= 5) return 90;
    if (len <= 6) return 85;
    if (len <= 8) return 75;
    if (len <= 10) return 65;
    if (len <= 12) return 50;
    if (len <= 15) return 30;
    return 10;
  }

  private static isPronounceabl(name: string): boolean {
    // Simple pronounceability check
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    
    let vowelCount = 0;
    let consonantRun = 0;
    
    for (const char of name.toLowerCase()) {
      if (vowels.includes(char)) {
        vowelCount++;
        consonantRun = 0;
      } else if (consonants.includes(char)) {
        consonantRun++;
        if (consonantRun > 3) return false; // Too many consonants in a row
      }
    }
    
    // Should have reasonable vowel ratio
    const vowelRatio = vowelCount / name.length;
    return vowelRatio >= 0.25 && vowelRatio <= 0.6;
  }

  private static isBrandabl(name: string): boolean {
    // Check if it's a made-up but brandable word
    const brandablePatterns = [
      /^[a-z]{4,8}(ly|ify|io|ia|eo|ara)$/i, // Endings like Spotify, Shopify
      /^[a-z]{3,6}[aeiou]{2}$/i, // Double vowel endings
      /^[a-z]{2,4}[x|z][a-z]{2,4}$/i, // Contains X or Z (modern feel)
    ];
    
    return brandablePatterns.some(pattern => pattern.test(name)) && 
           this.isPronounceabl(name) &&
           !this.VALUABLE_KEYWORDS.includes(name.toLowerCase());
  }

  private static scoreKeywords(name: string): number {
    const lowerName = name.toLowerCase();
    let score = 0;
    
    for (const keyword of this.VALUABLE_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        score += 20;
      }
    }
    
    return Math.min(score, 100);
  }

  private static scoreMarketDemand(name: string, context?: MarketContext): number {
    let score = 50; // Base score
    
    if (context?.targetCountry) {
      // Boost score for local language keywords
      const countryKeywords: Record<string, string[]> = {
        'DE': ['deutsch', 'berlin', 'munich', 'frankfurt'],
        'FR': ['france', 'paris', 'lyon', 'marseille'],
        'UK': ['london', 'british', 'england', 'scotland'],
        'NL': ['dutch', 'amsterdam', 'holland', 'nederland'],
      };
      
      const keywords = countryKeywords[context.targetCountry] || [];
      if (keywords.some(kw => name.toLowerCase().includes(kw))) {
        score += 30;
      }
    }
    
    if (context?.industry) {
      // Industry-specific scoring
      const industryKeywords: Record<string, string[]> = {
        'tech': ['tech', 'app', 'software', 'cloud', 'data', 'ai'],
        'finance': ['pay', 'bank', 'invest', 'finance', 'money', 'crypto'],
        'retail': ['shop', 'store', 'buy', 'mart', 'deal', 'sale'],
        'health': ['health', 'med', 'care', 'fit', 'well', 'life'],
      };
      
      const keywords = industryKeywords[context.industry.toLowerCase()] || [];
      if (keywords.some(kw => name.toLowerCase().includes(kw))) {
        score += 20;
      }
    }
    
    return Math.min(score, 100);
  }

  private static scoreMemorability(name: string): number {
    let score = 70; // Base score
    
    // Repeated letters reduce memorability
    if (/(.)\1{2,}/.test(name)) score -= 20;
    
    // Alternating consonants and vowels increase memorability
    if (/^([bcdfghjklmnpqrstvwxyz][aeiou])+[bcdfghjklmnpqrstvwxyz]?$/i.test(name)) {
      score += 20;
    }
    
    // Common patterns increase memorability
    if (/^(re|un|pre|pro|co|de)[a-z]+$/i.test(name)) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private static scoreTypingEase(name: string): number {
    let score = 100;
    
    // Penalize hard to type combinations
    const hardCombos = ['xz', 'qw', 'jk', 'vb', 'fg', 'hy', 'nm'];
    for (const combo of hardCombos) {
      if (name.toLowerCase().includes(combo)) score -= 10;
    }
    
    // Alternating hands is easier
    const leftHand = 'qwertasdfgzxcvb';
    const rightHand = 'yuiophjklnm';
    let alternates = 0;
    let lastHand = '';
    
    for (const char of name.toLowerCase()) {
      const currentHand = leftHand.includes(char) ? 'left' : 'right';
      if (lastHand && currentHand !== lastHand) alternates++;
      lastHand = currentHand;
    }
    
    if (alternates > name.length * 0.6) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }
}