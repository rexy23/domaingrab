import { NextRequest, NextResponse } from 'next/server';
import { DomainChecker } from '@/lib/domain-checker';
import { searchRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { query, enhanced = false, targetCountry, industry } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get user session for enhanced features
    const session = await getServerSession(authOptions);

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limit
    const rateLimitResult = await searchRateLimit.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // Check if user can use enhanced analysis
    const canUseEnhanced = enhanced && (
      !session || // Allow for demo purposes
      session.user.subscriptionTier !== 'free' || 
      session.user.subscriptionStatus === 'active'
    );

    // Initialize domain checker
    const domainChecker = new DomainChecker();

    // Prepare market context for enhanced analysis
    const marketContext = canUseEnhanced ? {
      query,
      targetCountry,
      industry
    } : undefined;

    // Generate domain suggestions
    const startTime = Date.now();
    const results = await domainChecker.generateDomainSuggestions(
      query, 
      50, 
      canUseEnhanced,
      marketContext
    );
    const responseTime = Date.now() - startTime;

    // Log search for analytics
    await prisma.searchLog.create({
      data: {
        userId: session?.user?.id || null,
        query,
        resultsCount: results.length,
        responseTime,
        ipAddress: clientIP.slice(0, 50),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Store domain intelligence in database for caching
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
          intelligenceData,
          confidence: result.enhancedIntelligence?.confidence || 0.7,
          lastChecked: new Date(),
        },
        create: {
          domain: result.domain,
          tld: result.tld,
          grabScore: result.grabScore,
          status: result.available ? 'available' : 'taken',
          intelligenceData,
          confidence: result.enhancedIntelligence?.confidence || 0.7,
        },
      });
    }

    return NextResponse.json({
      query,
      results,
      meta: {
        total: results.length,
        responseTime,
        rateLimitRemaining: rateLimitResult.remaining,
        enhancedAnalysisUsed: canUseEnhanced,
        aiAnalyzedDomains: results.filter(r => r.enhancedIntelligence).length,
      },
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}