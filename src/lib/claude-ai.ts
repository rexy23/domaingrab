import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BasicIntelligence {
  length: number;
  hasNumbers: boolean;
  hasHyphens: boolean;
  keywordDensity: number;
  pronounceable: boolean;
  brandable: boolean;
}

export interface MarketContext {
  query: string;
  targetCountry?: string;
  industry?: string;
}

export interface EnhancedDomainIntelligence {
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
  analysisVersion: string;
}

export class ClaudeAI {
  private readonly cacheMap = new Map<string, EnhancedDomainIntelligence>();

  async analyzeDomain(
    domain: string,
    basicIntelligence: BasicIntelligence,
    marketContext?: MarketContext
  ): Promise<EnhancedDomainIntelligence> {
    const cacheKey = `${domain}_${JSON.stringify(marketContext)}`;
    
    if (this.cacheMap.has(cacheKey)) {
      return this.cacheMap.get(cacheKey)!;
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: this.buildAnalysisPrompt(domain, basicIntelligence, marketContext)
        }]
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysis = this.parseAnalysisResponse(analysisText, domain, basicIntelligence);
      
      // Cache for 1 hour
      this.cacheMap.set(cacheKey, analysis);
      setTimeout(() => this.cacheMap.delete(cacheKey), 60 * 60 * 1000);

      return analysis;
    } catch (error) {
      console.error('Claude AI analysis error:', error);
      return this.getFallbackAnalysis(domain, basicIntelligence);
    }
  }

  private buildAnalysisPrompt(
    domain: string,
    basicIntelligence: BasicIntelligence,
    marketContext?: MarketContext
  ): string {
    const [domainName, tld] = domain.split('.');
    
    return `Analyze the domain "${domain}" for the European market as an expert domain investor and brand strategist.

Domain Details:
- Name: ${domainName}
- TLD: .${tld}
- Length: ${basicIntelligence.length} characters
- Contains numbers: ${basicIntelligence.hasNumbers}
- Contains hyphens: ${basicIntelligence.hasHyphens}
- Pronounceable: ${basicIntelligence.pronounceable}

${marketContext ? `
Market Context:
- User search query: "${marketContext.query}"
- Target region: ${marketContext.targetCountry || 'EU/UK'}
- Industry focus: ${marketContext.industry || 'Not specified'}
` : ''}

Provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON, no markdown):

{
  "grabScore": <1-100 integer score>,
  "brandability": {
    "score": <1-100>,
    "reasoning": "<2-3 sentence explanation>",
    "brandPotential": "<high|medium|low>"
  },
  "marketFit": {
    "score": <1-100>,
    "targetMarkets": ["<market1>", "<market2>"],
    "culturalRelevance": "<brief cultural analysis>",
    "localizedAppeal": <1-100>
  },
  "businessPotential": {
    "score": <1-100>,
    "suggestedIndustries": ["<industry1>", "<industry2>"],
    "monetizationPotential": "<revenue potential analysis>",
    "competitiveAdvantage": "<unique selling points>"
  },
  "linguisticAnalysis": {
    "pronounceability": <1-100>,
    "memorability": <1-100>,
    "crossLanguageAppeal": <1-100>,
    "phoneticHarmonics": "<sound analysis>"
  },
  "riskAssessment": {
    "trademarkRisk": "<low|medium|high>",
    "typoSquattingRisk": <1-100>,
    "brandingConflicts": ["<potential conflict1>"],
    "legalConsiderations": "<legal risks>"
  },
  "confidence": <1-100>
}

Focus on:
1. EU/UK market cultural fit and linguistic appeal
2. Business potential in European markets
3. Brand memorability and pronunciation across EU languages
4. Competitive advantages and market positioning
5. Legal and trademark considerations for EU markets`;
  }

  private parseAnalysisResponse(response: string, domain: string, basicIntelligence: BasicIntelligence): EnhancedDomainIntelligence {
    try {
      // Clean the response - remove any markdown formatting
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      
      return {
        ...parsed,
        analysisVersion: '1.0',
        confidence: Math.min(100, Math.max(1, parsed.confidence || 75))
      };
    } catch (error) {
      console.error('Failed to parse Claude AI response:', error);
      return this.getFallbackAnalysis(domain, basicIntelligence);
    }
  }

  private getFallbackAnalysis(domain: string, basicIntelligence: BasicIntelligence): EnhancedDomainIntelligence {
    const [domainName] = domain.split('.');
    const length = domainName.length;
    
    return {
      grabScore: 60, // Conservative fallback score
      brandability: {
        score: length <= 8 && !basicIntelligence.hasNumbers ? 75 : 45,
        reasoning: "Fallback analysis due to AI service unavailability.",
        brandPotential: length <= 8 ? 'medium' : 'low'
      },
      marketFit: {
        score: 60,
        targetMarkets: ['EU', 'General'],
        culturalRelevance: "Analysis unavailable",
        localizedAppeal: 50
      },
      businessPotential: {
        score: 55,
        suggestedIndustries: ['Technology', 'General Business'],
        monetizationPotential: "Standard domain potential",
        competitiveAdvantage: "Standard domain characteristics"
      },
      linguisticAnalysis: {
        pronounceability: basicIntelligence.pronounceable ? 70 : 40,
        memorability: length <= 6 ? 80 : 50,
        crossLanguageAppeal: 60,
        phoneticHarmonics: "Not analyzed"
      },
      riskAssessment: {
        trademarkRisk: 'medium',
        typoSquattingRisk: length <= 6 ? 70 : 30,
        brandingConflicts: [],
        legalConsiderations: "Standard due diligence recommended"
      },
      confidence: 30, // Low confidence for fallback
      analysisVersion: '1.0-fallback'
    };
  }

  async batchAnalyzeDomains(
    domains: Array<{domain: string, basicIntelligence: BasicIntelligence}>,
    marketContext?: MarketContext
  ): Promise<Array<{domain: string, analysis: EnhancedDomainIntelligence}>> {
    // Process in batches of 3 to avoid rate limits
    const batchSize = 3;
    const results: Array<{domain: string, analysis: EnhancedDomainIntelligence}> = [];

    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ domain, basicIntelligence }) => ({
        domain,
        analysis: await this.analyzeDomain(domain, basicIntelligence, marketContext)
      }));

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}