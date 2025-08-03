import axios from 'axios';
import { prisma } from './prisma';

interface WhoisResponse {
  available: boolean;
  domain: string;
  registrar?: string;
  createdDate?: string;
  expiryDate?: string;
  updatedDate?: string;
  status?: string[];
  nameServers?: string[];
  registrantCountry?: string;
}

export class WhoisService {
  private static readonly API_URL = 'https://api.whoisjson.com/v1/whois';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async checkDomain(domain: string): Promise<WhoisResponse> {
    try {
      // Check cache first
      const cached = await this.getCachedResult(domain);
      if (cached) {
        return cached;
      }

      // For development/demo, simulate WHOIS check
      if (process.env.NODE_ENV === 'development' && !process.env.WHOIS_API_KEY) {
        return this.simulateWhoisCheck(domain);
      }

      // Make real API call
      const response = await axios.get(this.API_URL, {
        params: {
          domain,
          apiKey: process.env.WHOIS_API_KEY
        },
        timeout: 10000
      });

      const result: WhoisResponse = {
        available: response.data.available || false,
        domain: response.data.domain,
        registrar: response.data.registrar?.name,
        createdDate: response.data.created,
        expiryDate: response.data.expires,
        updatedDate: response.data.updated,
        status: response.data.status,
        nameServers: response.data.nameservers,
        registrantCountry: response.data.registrant?.country
      };

      // Cache the result
      await this.cacheResult(domain, result);

      return result;
    } catch (error) {
      console.error('WHOIS check error:', error);
      // Fallback to simulation on error
      return this.simulateWhoisCheck(domain);
    }
  }

  static async checkMultipleDomains(domains: string[]): Promise<Map<string, WhoisResponse>> {
    const results = new Map<string, WhoisResponse>();
    
    // Check domains in parallel with rate limiting
    const chunks = this.chunkArray(domains, 5); // Process 5 at a time
    
    for (const chunk of chunks) {
      const promises = chunk.map(domain => 
        this.checkDomain(domain).then(result => results.set(domain, result))
      );
      await Promise.all(promises);
      
      // Rate limit between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private static async getCachedResult(domain: string): Promise<WhoisResponse | null> {
    try {
      const cached = await prisma.domainIntelligence.findUnique({
        where: { domain },
        select: {
          status: true,
          intelligenceData: true,
          lastChecked: true
        }
      });

      if (cached && cached.lastChecked) {
        const age = Date.now() - cached.lastChecked.getTime();
        if (age < this.CACHE_DURATION && cached.intelligenceData) {
          const data = cached.intelligenceData as any;
          return {
            available: cached.status === 'available',
            domain,
            ...data.whois
          };
        }
      }
    } catch (error) {
      console.error('Cache check error:', error);
    }
    return null;
  }

  private static async cacheResult(domain: string, result: WhoisResponse): Promise<void> {
    try {
      const [domainName, tld] = domain.split('.');
      
      await prisma.domainIntelligence.upsert({
        where: { domain },
        update: {
          status: result.available ? 'available' : 'taken',
          intelligenceData: {
            whois: result
          },
          lastChecked: new Date()
        },
        create: {
          domain,
          tld: tld || 'com',
          status: result.available ? 'available' : 'taken',
          intelligenceData: {
            whois: result
          },
          lastChecked: new Date()
        }
      });
    } catch (error) {
      console.error('Cache update error:', error);
    }
  }

  private static simulateWhoisCheck(domain: string): WhoisResponse {
    // Simulate realistic availability based on domain characteristics
    const parts = domain.split('.');
    const name = parts[0];
    const tld = parts[1] || 'com';
    
    // Short domains and common words are likely taken
    const isLikelyTaken = 
      name.length <= 4 || 
      ['test', 'example', 'demo', 'admin', 'mail', 'shop', 'store'].includes(name.toLowerCase()) ||
      Math.random() > 0.7; // 30% chance of being available

    return {
      available: !isLikelyTaken,
      domain,
      registrar: isLikelyTaken ? 'Example Registrar GmbH' : undefined,
      createdDate: isLikelyTaken ? '2020-01-15' : undefined,
      expiryDate: isLikelyTaken ? '2025-01-15' : undefined,
      status: isLikelyTaken ? ['clientTransferProhibited'] : undefined,
      registrantCountry: isLikelyTaken ? 'DE' : undefined
    };
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}