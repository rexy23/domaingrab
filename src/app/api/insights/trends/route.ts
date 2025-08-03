import { NextRequest, NextResponse } from 'next/server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'EU';
    const period = searchParams.get('period') || '7d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Get trending keywords from search logs
    const trendingKeywords = await prisma.$queryRaw`
      SELECT 
        LOWER(query) as keyword,
        COUNT(*) as search_count,
        COUNT(DISTINCT "userId") as unique_users
      FROM search_logs
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY LOWER(query)
      ORDER BY search_count DESC
      LIMIT 20
    ` as Array<{ keyword: string; search_count: bigint; unique_users: bigint }>;
    
    // Get popular TLDs
    const popularTlds = await prisma.$queryRaw`
      SELECT 
        tld,
        COUNT(*) as check_count,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_count
      FROM domain_intelligence
      WHERE "lastChecked" >= ${startDate}
      GROUP BY tld
      ORDER BY check_count DESC
      LIMIT 10
    ` as Array<{ tld: string; check_count: bigint; available_count: bigint }>;
    
    // Get high-scoring available domains
    const topDomains = await prisma.domainIntelligence.findMany({
      where: {
        status: 'available',
        grabScore: { gte: 80 },
        lastChecked: { gte: startDate }
      },
      select: {
        domain: true,
        grabScore: true,
        tld: true,
      },
      orderBy: { grabScore: 'desc' },
      take: 10,
    });
    
    // Market insights
    const insights = {
      trending: {
        keywords: trendingKeywords.map(k => ({
          keyword: k.keyword,
          searchCount: Number(k.search_count),
          uniqueUsers: Number(k.unique_users),
          trend: calculateTrend(k.search_count),
        })),
        period,
      },
      tlds: {
        popular: popularTlds.map(t => ({
          tld: t.tld,
          checkCount: Number(t.check_count),
          availableCount: Number(t.available_count),
          availabilityRate: Number(t.available_count) / Number(t.check_count),
        })),
      },
      opportunities: {
        highScore: topDomains,
        shortDomains: await getShortDomains(startDate),
        expiringDomains: await getExpiringDomains(),
      },
      marketStats: {
        averageScore: await getAverageScore(startDate),
        availabilityRate: await getAvailabilityRate(startDate),
        topCountries: await getTopCountries(),
      },
    };
    
    const response = NextResponse.json({
      insights,
      meta: {
        country,
        period,
        generated: new Date().toISOString(),
      }
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
});

// Helper functions
function calculateTrend(count: bigint): string {
  const n = Number(count);
  if (n > 100) return 'hot';
  if (n > 50) return 'rising';
  if (n > 20) return 'moderate';
  return 'emerging';
}

async function getShortDomains(since: Date) {
  return prisma.domainIntelligence.findMany({
    where: {
      status: 'available',
      lastChecked: { gte: since },
      domain: { contains: '.' },
    },
    select: {
      domain: true,
      grabScore: true,
    },
    orderBy: { grabScore: 'desc' },
    take: 5,
  }).then(domains => 
    domains.filter(d => d.domain.split('.')[0].length <= 5)
  );
}

async function getExpiringDomains() {
  // In production, this would check actual expiry dates
  // For now, return mock data
  return [
    { domain: 'techstart.eu', expiryDate: '2024-12-15', grabScore: 85 },
    { domain: 'cloudpro.de', expiryDate: '2024-11-30', grabScore: 82 },
  ];
}

async function getAverageScore(since: Date): Promise<number> {
  const result = await prisma.domainIntelligence.aggregate({
    where: {
      lastChecked: { gte: since },
      grabScore: { not: null },
    },
    _avg: { grabScore: true },
  });
  
  return Math.round(result._avg.grabScore || 0);
}

async function getAvailabilityRate(since: Date): Promise<number> {
  const total = await prisma.domainIntelligence.count({
    where: { lastChecked: { gte: since } }
  });
  
  const available = await prisma.domainIntelligence.count({
    where: {
      lastChecked: { gte: since },
      status: 'available',
    }
  });
  
  return total > 0 ? Math.round((available / total) * 100) / 100 : 0;
}

async function getTopCountries() {
  // Mock data for demo
  return [
    { country: 'DE', percentage: 28 },
    { country: 'UK', percentage: 22 },
    { country: 'FR', percentage: 18 },
    { country: 'NL', percentage: 12 },
    { country: 'IT', percentage: 10 },
    { country: 'Other', percentage: 10 },
  ];
}