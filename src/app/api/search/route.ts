import { NextRequest, NextResponse } from 'next/server';
import { DomainChecker } from '@/lib/domain-checker';
import { searchRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

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

    // Initialize domain checker
    const domainChecker = new DomainChecker();

    // Generate domain suggestions
    const startTime = Date.now();
    const results = await domainChecker.generateDomainSuggestions(query, 50);
    const responseTime = Date.now() - startTime;

    // Log search for analytics
    await prisma.searchLog.create({
      data: {
        query,
        resultsCount: results.length,
        responseTime,
        ipAddress: clientIP.slice(0, 50),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Store domain intelligence in database for caching
    for (const result of results) {
      await prisma.domainIntelligence.upsert({
        where: { domain: result.domain },
        update: {
          grabScore: result.grabScore,
          status: result.available ? 'available' : 'taken',
          intelligenceData: result.basicIntelligence,
          lastChecked: new Date(),
        },
        create: {
          domain: result.domain,
          tld: result.tld,
          grabScore: result.grabScore,
          status: result.available ? 'available' : 'taken',
          intelligenceData: result.basicIntelligence,
          confidence: 0.7, // Basic confidence for simple scoring
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