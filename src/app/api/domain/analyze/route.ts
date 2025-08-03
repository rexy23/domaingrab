import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClaudeAI, MarketContext } from '@/lib/claude-ai';
import { GDPRCompliance } from '@/lib/gdpr-compliance';
import { apiRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const claudeAI = new ClaudeAI();
const gdprCompliance = new GDPRCompliance({
  retentionPeriod: 30,
  anonymizationLevel: 'enhanced',
  dataProcessingBasis: 'legitimate_interest',
  geolocation: 'EU'
});

export async function POST(request: NextRequest) {
  try {
    const { domain, basicIntelligence, marketContext } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    
    // Check if user has access to enhanced analysis
    if (!session || (session.user.subscriptionTier === 'free' && session.user.subscriptionStatus !== 'active')) {
      return NextResponse.json(
        { error: 'Enhanced analysis requires a premium subscription' },
        { status: 403 }
      );
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limit (more restrictive for AI analysis)
    const rateLimitResult = await apiRateLimit.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded for AI analysis',
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

    // Sanitize input data for GDPR compliance
    const sanitizedMarketContext = gdprCompliance.sanitizeData(marketContext) as MarketContext | undefined;

    // Perform Claude AI analysis
    const analysis = await claudeAI.analyzeDomain(
      domain,
      basicIntelligence,
      sanitizedMarketContext
    );

    // Store enhanced analysis in database
    await prisma.domainIntelligence.upsert({
      where: { domain },
      update: {
        intelligenceData: {
          basic: basicIntelligence,
          enhanced: JSON.parse(JSON.stringify(analysis))
        },
        confidence: analysis.confidence,
        grabScore: analysis.grabScore,
        lastChecked: new Date(),
      },
      create: {
        domain,
        tld: domain.split('.').pop() || '',
        intelligenceData: {
          basic: basicIntelligence,
          enhanced: JSON.parse(JSON.stringify(analysis))
        },
        confidence: analysis.confidence,
        grabScore: analysis.grabScore,
        status: 'analyzed',
      },
    });

    // Create data processing record for compliance
    const processingRecord = gdprCompliance.createDataProcessingRecord(
      'Domain intelligence analysis',
      ['domain_name', 'market_context', 'linguistic_analysis'],
      'legitimate_interest',
      30
    );

    return NextResponse.json({
      analysis,
      meta: {
        processingId: processingRecord.id,
        confidence: analysis.confidence,
        analysisVersion: analysis.analysisVersion,
        rateLimitRemaining: rateLimitResult.remaining,
        userId: session.user.id,
      },
    });

  } catch (error) {
    console.error('Domain analysis API error:', error);
    
    // Return sanitized error message
    return NextResponse.json(
      { error: 'Analysis service temporarily unavailable' },
      { status: 503 }
    );
  }
}