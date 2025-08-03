import { redis } from './redis';
import { GDPRCompliance } from './gdpr-compliance';

export interface BusinessRegistryResult {
  domain: string;
  companyMatches: CompanyMatch[];
  registrationData?: CompanyRegistration;
  riskAssessment: {
    nameConflictRisk: 'low' | 'medium' | 'high';
    businessConflictRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  dataComplianceScore: number;
  lastChecked: Date;
}

export interface CompanyMatch {
  companyName: string;
  registrationNumber: string;
  jurisdiction: string;
  status: 'active' | 'dissolved' | 'dormant';
  incorporationDate: string;
  industry: string;
  similarity: number;
  companyType: string; // Ltd, GmbH, S.A., etc.
}

export interface CompanyRegistration {
  isRegistered: boolean;
  companyName?: string;
  registrationNumber?: string;
  jurisdiction?: string;
  incorporationDate?: string;
  status?: string;
  directors?: string[]; // Redacted for GDPR
  industry?: string;
}

export class BusinessRegistry {
  private gdprCompliance: GDPRCompliance;

  constructor() {
    this.gdprCompliance = new GDPRCompliance({
      retentionPeriod: 30,
      anonymizationLevel: 'enhanced',
      dataProcessingBasis: 'legitimate_interest',
      geolocation: 'EU'
    });
  }

  async checkBusinessRegistry(domain: string): Promise<BusinessRegistryResult> {
    const cacheKey = `business_registry:${domain}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached as string);
    }

    const domainName = domain.split('.')[0];
    
    try {
      // Check multiple EU business registries
      const [companiesHouseResults, germanResults, frenchResults, dutchResults] = await Promise.allSettled([
        this.checkCompaniesHouse(domainName),
        this.checkGermanRegistry(domainName),
        this.checkFrenchRegistry(domainName),
        this.checkDutchRegistry(domainName)
      ]);

      const allMatches: CompanyMatch[] = [];

      if (companiesHouseResults.status === 'fulfilled') {
        allMatches.push(...companiesHouseResults.value);
      }

      if (germanResults.status === 'fulfilled') {
        allMatches.push(...germanResults.value);
      }

      if (frenchResults.status === 'fulfilled') {
        allMatches.push(...frenchResults.value);
      }

      if (dutchResults.status === 'fulfilled') {
        allMatches.push(...dutchResults.value);
      }

      // GDPR compliance - sanitize all data
      const sanitizedMatches = this.gdprCompliance.sanitizeData(allMatches) as CompanyMatch[];

      // Check if domain itself is registered as a company
      const registrationData = await this.checkDirectRegistration(domainName);
      const sanitizedRegistration = this.gdprCompliance.sanitizeData(registrationData) as CompanyRegistration | undefined;

      // Assess risks
      const riskAssessment = this.assessBusinessRisks(sanitizedMatches);

      // Calculate GDPR compliance score
      const complianceReport = this.gdprCompliance.generateComplianceReport({
        matches: sanitizedMatches,
        registration: sanitizedRegistration
      });

      const result: BusinessRegistryResult = {
        domain,
        companyMatches: sanitizedMatches.slice(0, 20), // Limit results
        registrationData: sanitizedRegistration,
        riskAssessment,
        dataComplianceScore: complianceReport.complianceScore,
        lastChecked: new Date()
      };

      // Cache for 12 hours (business data changes less frequently)
      await redis.set(cacheKey, JSON.stringify(result), { ex: 12 * 60 * 60 });

      return result;
    } catch (error) {
      console.error('Business registry check error:', error);
      return this.getFallbackResult(domain);
    }
  }

  private async checkCompaniesHouse(domainName: string): Promise<CompanyMatch[]> {
    // Simulate UK Companies House API check
    await new Promise(resolve => setTimeout(resolve, 300));

    const matches: CompanyMatch[] = [];

    // Common UK business patterns
    const ukSuffixes = ['ltd', 'limited', 'plc', 'llp'];
    
    ukSuffixes.forEach(suffix => {
      const similarity = this.calculateBusinessSimilarity(domainName, `${domainName} ${suffix}`);
      
      if (similarity > 60 || domainName.toLowerCase().includes(suffix)) {
        matches.push({
          companyName: `${this.capitalizeWords(domainName)} ${suffix.toUpperCase()}`,
          registrationNumber: `0${Math.floor(Math.random() * 9999999).toString().padStart(7, '0')}`,
          jurisdiction: 'UK',
          status: Math.random() > 0.8 ? 'dissolved' : 'active',
          incorporationDate: this.generateRandomDate(2010, 2023),
          industry: this.inferIndustry(domainName),
          similarity,
          companyType: suffix.toUpperCase()
        });
      }
    });

    return matches;
  }

  private async checkGermanRegistry(domainName: string): Promise<CompanyMatch[]> {
    // Simulate German Handelsregister check
    await new Promise(resolve => setTimeout(resolve, 250));

    const matches: CompanyMatch[] = [];
    const germanSuffixes = ['GmbH', 'AG', 'UG', 'KG'];

    germanSuffixes.forEach(suffix => {
      const similarity = this.calculateBusinessSimilarity(domainName, `${domainName} ${suffix}`);
      
      if (similarity > 55) {
        matches.push({
          companyName: `${this.capitalizeWords(domainName)} ${suffix}`,
          registrationNumber: `HRB ${Math.floor(Math.random() * 99999)}`,
          jurisdiction: 'DE',
          status: 'active',
          incorporationDate: this.generateRandomDate(2015, 2023),
          industry: this.inferIndustry(domainName),
          similarity,
          companyType: suffix
        });
      }
    });

    return matches;
  }

  private async checkFrenchRegistry(domainName: string): Promise<CompanyMatch[]> {
    // Simulate French INSEE/SIRENE check
    await new Promise(resolve => setTimeout(resolve, 200));

    const matches: CompanyMatch[] = [];
    const frenchSuffixes = ['SARL', 'SAS', 'SA', 'SNC'];

    frenchSuffixes.forEach(suffix => {
      const similarity = this.calculateBusinessSimilarity(domainName, `${domainName} ${suffix}`);
      
      if (similarity > 55) {
        matches.push({
          companyName: `${this.capitalizeWords(domainName)} ${suffix}`,
          registrationNumber: `${Math.floor(Math.random() * 999999999).toString().padStart(9, '0')}`,
          jurisdiction: 'FR',
          status: 'active',
          incorporationDate: this.generateRandomDate(2012, 2023),
          industry: this.inferIndustry(domainName),
          similarity,
          companyType: suffix
        });
      }
    });

    return matches;
  }

  private async checkDutchRegistry(domainName: string): Promise<CompanyMatch[]> {
    // Simulate Dutch KVK (Kamer van Koophandel) check
    await new Promise(resolve => setTimeout(resolve, 180));

    const matches: CompanyMatch[] = [];
    const dutchSuffixes = ['BV', 'NV', 'VOF', 'CV'];

    dutchSuffixes.forEach(suffix => {
      const similarity = this.calculateBusinessSimilarity(domainName, `${domainName} ${suffix}`);
      
      if (similarity > 55) {
        matches.push({
          companyName: `${this.capitalizeWords(domainName)} ${suffix}`,
          registrationNumber: `${Math.floor(Math.random() * 99999999).toString().padStart(8, '0')}`,
          jurisdiction: 'NL',
          status: 'active',
          incorporationDate: this.generateRandomDate(2014, 2023),
          industry: this.inferIndustry(domainName),
          similarity,
          companyType: suffix
        });
      }
    });

    return matches;
  }

  private async checkDirectRegistration(domainName: string): Promise<CompanyRegistration | undefined> {
    // Check if the domain name itself is registered as a company
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate probability of direct registration
    if (Math.random() > 0.7) {
      return {
        isRegistered: true,
        companyName: `${this.capitalizeWords(domainName)} Limited`,
        registrationNumber: `0${Math.floor(Math.random() * 9999999).toString().padStart(7, '0')}`,
        jurisdiction: 'UK',
        incorporationDate: this.generateRandomDate(2018, 2023),
        status: 'active',
        directors: ['[REDACTED]'], // GDPR compliance
        industry: this.inferIndustry(domainName)
      };
    }

    return {
      isRegistered: false
    };
  }

  private calculateBusinessSimilarity(domain: string, businessName: string): number {
    const domainLower = domain.toLowerCase().replace(/[^a-z0-9]/g, '');
    const businessLower = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (domainLower === businessLower) return 100;
    if (businessLower.includes(domainLower)) return 90;
    if (domainLower.includes(businessLower)) return 85;

    // Simple overlap calculation
    let overlap = 0;
    const shorter = domainLower.length < businessLower.length ? domainLower : businessLower;
    const longer = domainLower.length >= businessLower.length ? domainLower : businessLower;

    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        overlap++;
      }
    }

    return Math.floor((overlap / longer.length) * 100);
  }

  private inferIndustry(domainName: string): string {
    const name = domainName.toLowerCase();
    
    if (name.includes('tech') || name.includes('app') || name.includes('software')) {
      return 'Technology';
    }
    if (name.includes('shop') || name.includes('store') || name.includes('market')) {
      return 'Retail/E-commerce';
    }
    if (name.includes('consult') || name.includes('service')) {
      return 'Professional Services';
    }
    if (name.includes('media') || name.includes('design') || name.includes('creative')) {
      return 'Media & Creative';
    }
    if (name.includes('health') || name.includes('medical') || name.includes('care')) {
      return 'Healthcare';
    }
    if (name.includes('finance') || name.includes('bank') || name.includes('invest')) {
      return 'Financial Services';
    }
    
    return 'General Business';
  }

  private capitalizeWords(str: string): string {
    return str.split(/[\s-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private generateRandomDate(startYear: number, endYear: number): string {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  }

  private assessBusinessRisks(matches: CompanyMatch[]): {
    nameConflictRisk: 'low' | 'medium' | 'high';
    businessConflictRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const activeMatches = matches.filter(m => m.status === 'active');
    const highSimilarityMatches = activeMatches.filter(m => m.similarity > 80);
    const mediumSimilarityMatches = activeMatches.filter(m => m.similarity > 60);

    let nameConflictRisk: 'low' | 'medium' | 'high' = 'low';
    let businessConflictRisk: 'low' | 'medium' | 'high' = 'low';

    if (highSimilarityMatches.length > 0) {
      nameConflictRisk = 'high';
      businessConflictRisk = 'high';
    } else if (mediumSimilarityMatches.length > 2) {
      nameConflictRisk = 'medium';
      businessConflictRisk = 'medium';
    } else if (activeMatches.length > 0) {
      nameConflictRisk = 'low';
      businessConflictRisk = 'low';
    }

    const recommendations: string[] = [];

    if (nameConflictRisk === 'high') {
      recommendations.push('🚨 High name conflict risk - Existing companies with similar names');
      recommendations.push('⚖️ Legal review recommended before business incorporation');
    } else if (nameConflictRisk === 'medium') {
      recommendations.push('⚠️ Moderate name similarity to existing companies');
      recommendations.push('🔍 Consider slight name variations');
    } else {
      recommendations.push('✅ Low business name conflict risk');
    }

    if (matches.length > 0) {
      const jurisdictions = [...new Set(matches.map(m => m.jurisdiction))];
      recommendations.push(`🌍 Check regulations in: ${jurisdictions.join(', ')}`);
    }

    recommendations.push('📋 Verify availability in target incorporation jurisdiction');
    recommendations.push('🏢 Consider business structure implications');

    return {
      nameConflictRisk,
      businessConflictRisk,
      recommendations
    };
  }

  private getFallbackResult(domain: string): BusinessRegistryResult {
    return {
      domain,
      companyMatches: [],
      riskAssessment: {
        nameConflictRisk: 'medium',
        businessConflictRisk: 'medium',
        recommendations: [
          '⚠️ Business registry check unavailable',
          '🏢 Manual company name search recommended',
          '⚖️ Consult business formation advisor'
        ]
      },
      dataComplianceScore: 85,
      lastChecked: new Date()
    };
  }

  async batchCheckBusinessRegistry(domains: string[]): Promise<Map<string, BusinessRegistryResult>> {
    const results = new Map<string, BusinessRegistryResult>();
    
    // Process in smaller batches due to multiple API calls per domain
    const batchSize = 3;
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(domain => 
        this.checkBusinessRegistry(domain).then(result => ({ domain, result }))
      );

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ domain, result }) => {
        results.set(domain, result);
      });

      // Longer delay for business registry APIs
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}