import { NextRequest, NextResponse } from 'next/server';
import { DataPipeline } from '@/lib/data-sources';
import { GDPRCompliance } from '@/lib/gdpr-compliance';
import { apiRateLimit } from '@/lib/rate-limit';

const dataPipeline = new DataPipeline();
const gdprCompliance = new GDPRCompliance({
  retentionPeriod: 30,
  anonymizationLevel: 'enhanced',
  dataProcessingBasis: 'legitimate_interest',
  geolocation: 'EU'
});

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Check rate limit
    const rateLimitResult = await apiRateLimit.checkLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded for domain history',
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

    // Gather domain intelligence from multiple sources
    const startTime = Date.now();
    const history = await dataPipeline.gatherDomainIntelligence(domain);
    const processingTime = Date.now() - startTime;

    // Sanitize data for GDPR compliance
    const sanitizedHistory = gdprCompliance.sanitizeData(history);

    // Generate compliance report
    const complianceReport = gdprCompliance.generateComplianceReport(sanitizedHistory);

    // Create data processing record
    const processingRecord = gdprCompliance.createDataProcessingRecord(
      'Domain history analysis',
      ['domain_name', 'wayback_data', 'dns_history', 'backlink_profile'],
      'legitimate_interest',
      30
    );

    // Get data source health for transparency
    const sourceHealth = await dataPipeline.getDataSourceHealth();

    return NextResponse.json({
      history: sanitizedHistory,
      meta: {
        processingId: processingRecord.id,
        processingTime,
        sourceHealth,
        complianceScore: complianceReport.complianceScore,
        rateLimitRemaining: rateLimitResult.remaining,
        gdprCompliant: complianceReport.complianceScore >= 80,
      },
    });

  } catch (error) {
    console.error('Domain history API error:', error);
    
    return NextResponse.json(
      { error: 'History service temporarily unavailable' },
      { status: 503 }
    );
  }
}