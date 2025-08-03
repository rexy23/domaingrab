import { redis } from './redis';

export interface DataSource {
  name: string;
  priority: number;
  rateLimit: number; // requests per minute
  reliability: number; // 0-1 score
}

export interface DomainHistory {
  waybackData?: {
    firstSeen?: string;
    lastSeen?: string;
    archiveCount: number;
    snapshots: Array<{
      timestamp: string;
      title?: string;
      description?: string;
      status: number;
    }>;
  };
  dnsHistory?: {
    previousOwners: number;
    registrationHistory: Array<{
      period: string;
      registrar?: string;
      status: string;
    }>;
    nameserverHistory: string[];
  };
  backlinkProfile?: {
    totalBacklinks: number;
    referringDomains: number;
    domainAuthority?: number;
    qualityScore: number;
    topReferrers: Array<{
      domain: string;
      links: number;
      authority: number;
    }>;
  };
  businessIntelligence?: {
    previousBusiness?: {
      name: string;
      industry: string;
      status: 'active' | 'inactive' | 'unknown';
    };
    marketPresence?: {
      socialMedia: string[];
      brandMentions: number;
      pressReferences: number;
    };
  };
}

export class DataPipeline {
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();

  async gatherDomainIntelligence(domain: string): Promise<DomainHistory> {
    const cacheKey = `intel:${domain}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached as string);
    }

    const intelligence: DomainHistory = {};

    // Gather data from multiple sources in parallel
    const [waybackData, dnsData, backlinkData, businessData] = await Promise.allSettled([
      this.getWaybackData(domain),
      this.getDNSHistory(domain),
      this.getBacklinkProfile(domain),
      this.getBusinessIntelligence(domain)
    ]);

    if (waybackData.status === 'fulfilled') {
      intelligence.waybackData = waybackData.value;
    }

    if (dnsData.status === 'fulfilled') {
      intelligence.dnsHistory = dnsData.value;
    }

    if (backlinkData.status === 'fulfilled') {
      intelligence.backlinkProfile = backlinkData.value;
    }

    if (businessData.status === 'fulfilled') {
      intelligence.businessIntelligence = businessData.value;
    }

    // Cache for 6 hours
    await redis.set(cacheKey, JSON.stringify(intelligence), { ex: 6 * 60 * 60 });

    return intelligence;
  }

  private async getWaybackData(domain: string) {
    if (!this.checkRateLimit('wayback', 30)) { // 30 requests per minute
      throw new Error('Rate limit exceeded for Wayback Machine');
    }

    try {
      // Wayback Machine CDX API
      const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${domain}&output=json&limit=50`;
      const response = await fetch(cdxUrl, {
        headers: {
          'User-Agent': 'DomainGrab.eu/1.0 (Research Tool)'
        }
      });

      if (!response.ok) {
        throw new Error(`Wayback API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return {
          archiveCount: 0,
          snapshots: []
        };
      }

      // Parse CDX response (first row is headers)
      const snapshots = data.slice(1).map((row: string[]) => ({
        timestamp: row[1],
        status: parseInt(row[4]) || 200,
        title: row[5] || undefined
      }));

      return {
        firstSeen: snapshots[0]?.timestamp,
        lastSeen: snapshots[snapshots.length - 1]?.timestamp,
        archiveCount: snapshots.length,
        snapshots: snapshots.slice(0, 10) // Keep latest 10
      };
    } catch (error) {
      console.error('Wayback data error:', error);
      return {
        archiveCount: 0,
        snapshots: []
      };
    }
  }

  private async getDNSHistory(_domain: string) {
    if (!this.checkRateLimit('dns', 60)) { // 60 requests per minute
      throw new Error('Rate limit exceeded for DNS');
    }

    try {
      // Simulate DNS history lookup (in production, use services like SecurityTrails)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock DNS data for development
      return {
        previousOwners: Math.floor(Math.random() * 5),
        registrationHistory: [
          {
            period: '2020-2023',
            registrar: 'Namecheap',
            status: 'active'
          }
        ],
        nameserverHistory: [
          'ns1.example.com',
          'ns2.example.com'
        ]
      };
    } catch (error) {
      console.error('DNS history error:', error);
      return {
        previousOwners: 0,
        registrationHistory: [],
        nameserverHistory: []
      };
    }
  }

  private async getBacklinkProfile(_domain: string) {
    if (!this.checkRateLimit('backlinks', 20)) { // 20 requests per minute
      throw new Error('Rate limit exceeded for backlink data');
    }

    try {
      // In production, integrate with Ahrefs, Majestic, or Moz API
      await new Promise(resolve => setTimeout(resolve, 150));

      // Mock backlink data
      const mockData = {
        totalBacklinks: Math.floor(Math.random() * 10000),
        referringDomains: Math.floor(Math.random() * 1000),
        domainAuthority: Math.floor(Math.random() * 100),
        qualityScore: Math.floor(Math.random() * 100),
        topReferrers: [
          {
            domain: 'example.com',
            links: Math.floor(Math.random() * 100),
            authority: Math.floor(Math.random() * 100)
          }
        ]
      };

      return mockData;
    } catch (error) {
      console.error('Backlink profile error:', error);
      return {
        totalBacklinks: 0,
        referringDomains: 0,
        qualityScore: 0,
        topReferrers: []
      };
    }
  }

  private async getBusinessIntelligence(domain: string) {
    if (!this.checkRateLimit('business', 40)) { // 40 requests per minute
      throw new Error('Rate limit exceeded for business intelligence');
    }

    try {
      // Mock business intelligence (in production, use Companies House API, etc.)
      await new Promise(resolve => setTimeout(resolve, 200));

      const industries = ['Technology', 'E-commerce', 'Consulting', 'Media', 'Finance'];
      const randomIndustry = industries[Math.floor(Math.random() * industries.length)];

      return {
        previousBusiness: Math.random() > 0.7 ? {
          name: `${domain.split('.')[0]} Ltd`,
          industry: randomIndustry,
          status: (Math.random() > 0.5 ? 'inactive' : 'active') as 'active' | 'inactive' | 'unknown'
        } : undefined,
        marketPresence: {
          socialMedia: Math.random() > 0.6 ? ['Twitter', 'LinkedIn'] : [],
          brandMentions: Math.floor(Math.random() * 500),
          pressReferences: Math.floor(Math.random() * 50)
        }
      };
    } catch (error) {
      console.error('Business intelligence error:', error);
      return {
        marketPresence: {
          socialMedia: [],
          brandMentions: 0,
          pressReferences: 0
        }
      };
    }
  }

  private checkRateLimit(service: string, limit: number): boolean {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${service}:${minute}`;

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, { count: 0, resetTime: (minute + 1) * 60000 });
      
      // Clean old entries
      for (const [oldKey, data] of this.rateLimiters.entries()) {
        if (data.resetTime < now) {
          this.rateLimiters.delete(oldKey);
        }
      }
    }

    const limiter = this.rateLimiters.get(key)!;
    
    if (limiter.count >= limit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  async getDataSourceHealth(): Promise<Record<string, { available: boolean; responseTime: number }>> {
    const sources = ['wayback', 'dns', 'backlinks', 'business'];
    const health: Record<string, { available: boolean; responseTime: number }> = {};

    await Promise.all(sources.map(async (source) => {
      const start = Date.now();
      try {
        // Quick health check for each service
        switch (source) {
          case 'wayback':
            await fetch('https://web.archive.org/', { method: 'HEAD' });
            break;
          case 'dns':
            // Mock DNS service check
            await new Promise(resolve => setTimeout(resolve, 50));
            break;
          case 'backlinks':
            // Mock backlink service check
            await new Promise(resolve => setTimeout(resolve, 75));
            break;
          case 'business':
            // Mock business service check
            await new Promise(resolve => setTimeout(resolve, 100));
            break;
        }
        
        health[source] = {
          available: true,
          responseTime: Date.now() - start
        };
      } catch (_error) {
        health[source] = {
          available: false,
          responseTime: Date.now() - start
        };
      }
    }));

    return health;
  }
}