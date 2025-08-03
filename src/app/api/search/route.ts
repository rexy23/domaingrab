import { NextRequest, NextResponse } from 'next/server';
import { DomainCheckerV2 } from '@/lib/domain-checker-v2';
import { enhancedSearchRateLimit } from '@/lib/rate-limit-enhanced';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { securityHeaders } from '@/lib/auth-middleware';
import { PLANS } from '@/lib/stripe-client';
import { SearchTracker } from '@/lib/search-tracking';
import { MockDomainService } from '@/lib/mock-domain-service';

export async function POST(request: NextRequest) {
  try {
    const { query, enhanced = false, targetCountry, industry } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get user session for enhanced features and rate limiting
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Get real client IP
    const clientIP = SearchTracker.getRealIP(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || undefined;
    const acceptEncoding = request.headers.get('accept-encoding') || undefined;
    
    // Get user subscription details if authenticated
    let userTier = 'free';
    let dailySearchLimit: number = PLANS.free.searchLimit;
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          subscriptionTier: true, 
          subscriptionStatus: true
        }
      });
      
      if (user) {
        userTier = user.subscriptionTier || 'free';
        const plan = PLANS[userTier as keyof typeof PLANS];
        dailySearchLimit = plan.searchLimit === -1 ? Number.MAX_SAFE_INTEGER : plan.searchLimit;
      }
    }
    
    // Use advanced tracking system to check search limits
    const trackingResult = await SearchTracker.trackSearch({
      ipAddress: clientIP,
      userAgent,
      acceptLanguage,
      acceptEncoding,
      userId
    });
    
    if (!trackingResult.allowed) {
      return NextResponse.json(
        { 
          error: `Daily search limit reached (${dailySearchLimit} searches for ${userTier} plan)`,
          upgradeUrl: '/pricing',
          resetTime: trackingResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': dailySearchLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': trackingResult.resetTime.toISOString(),
          }
        }
      );
    }

    // Check general rate limit
    const rateLimitResult = await enhancedSearchRateLimit.checkLimit(clientIP, session);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          limit: rateLimitResult.limit,
          type: rateLimitResult.type
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'X-RateLimit-Type': rateLimitResult.type,
          }
        }
      );
    }

    // Check if user can use enhanced analysis
    const canUseEnhanced = enhanced && userTier !== 'free';

    // Initialize domain checker
    const domainChecker = new DomainCheckerV2();

    // Prepare market context for enhanced analysis
    const marketContext = canUseEnhanced ? {
      query,
      targetCountry,
      industry
    } : undefined;

    // Check if external APIs are configured
    const hasWhoisAPI = process.env.WHOIS_API_KEY && process.env.WHOIS_API_KEY !== 'your_whois_api_key';
    const hasMozAPI = process.env.MOZ_ACCESS_ID && process.env.MOZ_ACCESS_ID !== 'your_moz_access_id';
    
    let results;
    let responseTime;
    
    // Use mock data if APIs are not configured
    if (!hasWhoisAPI || !hasMozAPI) {
      const startTime = Date.now();
      const mockResults = MockDomainService.generateMockResults(query, userTier === 'free' ? 10 : 20);
      responseTime = Date.now() - startTime;
      
      // Transform mock results to match expected format
      results = mockResults.map(mock => ({
        domain: mock.domain,
        tld: mock.domain.substring(mock.domain.lastIndexOf('.')),
        available: mock.available,
        grabScore: mock.score,
        scoreExplanation: [
          `Domain length: ${mock.domain.length} characters`,
          `Brandability: ${mock.brandability}`,
          mock.available ? 'Domain is available' : 'Domain is taken',
          mock.da ? `Domain Authority: ${mock.da}` : '',
        ].filter(Boolean),
        basicIntelligence: {
          length: mock.domain.length,
          hasNumbers: /\d/.test(mock.domain),
          hasHyphens: /-/.test(mock.domain),
          keywordDensity: mock.keywords?.length || 0,
          pronounceable: mock.brandability !== 'low',
          brandable: mock.brandability === 'high',
        },
        whoisData: !mock.available ? {
          registrar: mock.registrar,
          expiryDate: mock.expires,
        } : undefined,
        enhancedIntelligence: canUseEnhanced ? {
          brandability: mock.brandability || 'medium',
          memorability: mock.score > 70 ? 'high' : 'medium',
          phoneticAppeal: mock.brandability === 'high' ? 'high' : 'medium',
          visualAppeal: 'medium',
          marketPotential: mock.score > 80 ? 'high' : mock.score > 60 ? 'medium' : 'low',
          seoScore: Math.round(mock.score * 0.8),
          internationalViability: mock.domain.length < 10 ? 'high' : 'medium',
          socialMediaAvailability: mock.available ? 'likely' : 'unlikely',
          legalRisks: 'low',
          linguisticAnalysis: {
            primaryLanguage: 'English',
            meaning: 'Mock analysis',
            culturalRelevance: 'medium',
          },
          industryRelevance: industry ? 0.7 : 0.5,
          competitorAnalysis: {
            similarDomains: mock.similar || [],
            marketSaturation: 'medium',
          },
          pricingRecommendation: {
            estimatedValue: mock.price ? parseFloat(mock.price) : 0,
            confidence: 0.8,
            factors: ['TLD popularity', 'Domain length', 'Keyword relevance'],
          },
          investmentScore: mock.score,
          recommendation: mock.available ? 'Strong buy' : 'Monitor for expiry',
          confidence: 0.85,
        } : undefined,
      }));
    } else {
      // Use real domain checker with APIs
      const startTime = Date.now();
      const maxResults = userTier === 'free' ? 20 : 50;
      results = await domainChecker.generateDomainSuggestions(
        query, 
        maxResults, 
        canUseEnhanced,
        marketContext
      );
      responseTime = Date.now() - startTime;
    }

    // Log search for analytics (only if user is authenticated)
    if (userId) {
      await prisma.searchLog.create({
        data: {
          userId,
          query,
          resultsCount: results.length,
          responseTime,
          ipAddress: clientIP.slice(0, 50),
          userAgent: request.headers.get('user-agent'),
        },
      });
    }

    // Store domain intelligence in database for caching (only for authenticated users)
    if (userId && userTier !== 'free') {
      for (const result of results) {
        const intelligenceData = {
          basic: result.basicIntelligence,
          ...(result.enhancedIntelligence && {
            enhanced: result.enhancedIntelligence
          })
        };

        await prisma.domainIntelligence.upsert({
          where: { domain: result.domain },
          update: {
            grabScore: result.grabScore,
            status: result.available ? 'available' : 'taken',
            intelligenceData: intelligenceData as any,
            confidence: result.enhancedIntelligence?.confidence || 0.7,
            lastChecked: new Date(),
          },
          create: {
            domain: result.domain,
            tld: result.tld,
            grabScore: result.grabScore,
            status: result.available ? 'available' : 'taken',
            intelligenceData: intelligenceData as any,
            confidence: result.enhancedIntelligence?.confidence || 0.7,
          },
        });
      }
    }

    const response = NextResponse.json({
      query,
      results,
      meta: {
        total: results.length,
        responseTime,
        rateLimitRemaining: rateLimitResult.remaining,
        enhancedAnalysisUsed: canUseEnhanced,
        aiAnalyzedDomains: results.filter(r => r.enhancedIntelligence).length,
        userTier,
        searchLimitRemaining: trackingResult.remaining === -1 ? 'unlimited' : trackingResult.remaining
      },
    });

    return securityHeaders(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}