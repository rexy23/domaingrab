import { NextRequest, NextResponse } from 'next/server';
import { ApiAuth } from '@/lib/api-auth';
import { DomainCheckerV2 } from '@/lib/domain-checker-v2';
import { securityHeaders } from '@/lib/auth-middleware';
import { z } from 'zod';

// API request schema
const checkDomainSchema = z.object({
  domain: z.string().min(3).max(255),
  enhanced: z.boolean().optional(),
  marketContext: z.object({
    targetCountry: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate API request
    const apiUser = await ApiAuth.authenticateRequest(req);
    
    if (!apiUser) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    // Check if user has API access
    if (apiUser.rateLimit === 0) {
      return NextResponse.json(
        { 
          error: 'API access not available for your plan',
          upgradeUrl: 'https://domaingrab.eu/pricing'
        },
        { status: 403 }
      );
    }
    
    // TODO: Implement rate limiting check
    
    // Parse and validate request
    const body = await req.json();
    const validation = checkDomainSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }
    
    const { domain, enhanced, marketContext } = validation.data;
    
    // Check if enhanced analysis is allowed
    const canUseEnhanced = enhanced && apiUser.subscriptionTier !== 'pro';
    
    // Check domain
    const domainChecker = new DomainCheckerV2();
    const result = await domainChecker.checkDomain(
      domain,
      canUseEnhanced,
      marketContext ? { ...marketContext, query: domain } : undefined
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid domain or unsupported TLD' },
        { status: 400 }
      );
    }
    
    // Format API response
    const apiResponse = {
      domain: result.domain,
      tld: result.tld,
      available: result.available,
      score: result.grabScore,
      scoreExplanation: result.scoreExplanation,
      intelligence: {
        basic: result.basicIntelligence,
        enhanced: result.enhancedIntelligence,
      },
      whois: result.whoisData,
      meta: {
        timestamp: new Date().toISOString(),
        enhanced: canUseEnhanced,
        apiVersion: '1.0',
      }
    };
    
    const response = NextResponse.json(apiResponse);
    return securityHeaders(response);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API documentation endpoint
export async function GET(req: NextRequest) {
  const docs = {
    endpoint: '/api/v1/domains/check',
    method: 'POST',
    description: 'Check domain availability and get intelligence data',
    authentication: 'Bearer token (API key)',
    request: {
      body: {
        domain: 'string (required) - Domain to check (e.g., "example.eu")',
        enhanced: 'boolean (optional) - Use AI-enhanced analysis',
        marketContext: {
          targetCountry: 'string (optional) - Target country code (e.g., "DE", "FR")',
          industry: 'string (optional) - Industry sector',
        }
      }
    },
    response: {
      domain: 'string - The checked domain',
      tld: 'string - Top-level domain',
      available: 'boolean - Availability status',
      score: 'number - GrabScore (0-100)',
      scoreExplanation: 'array - Scoring factors explanation',
      intelligence: {
        basic: 'object - Basic domain intelligence',
        enhanced: 'object - AI-enhanced intelligence (if requested)',
      },
      whois: 'object - WHOIS data (if domain is taken)',
      meta: 'object - Response metadata',
    },
    rateLimits: {
      pro: '1,000 requests/month',
      business: '10,000 requests/month',
      enterprise: 'Unlimited',
    }
  };
  
  return NextResponse.json(docs);
}
