import { NextRequest, NextResponse } from 'next/server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';
import { DomainCheckerV2 } from '@/lib/domain-checker-v2';
import { PLANS } from '@/lib/stripe-client';
import { z } from 'zod';

// Validation schema
const bulkCheckSchema = z.object({
  domains: z.array(z.string().min(3).max(255)).min(1).max(100),
  enhanced: z.boolean().optional(),
  marketContext: z.object({
    targetCountry: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
});

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // Only business and enterprise users can use bulk operations
    const userPlan = user.role === 'admin' ? 'enterprise' : 
                    (await getUserPlan(user.id)) || 'free';
    
    if (userPlan !== 'business' && userPlan !== 'enterprise' && user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Bulk operations are only available for Business and Enterprise plans',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validation = bulkCheckSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { domains, enhanced, marketContext } = validation.data;

    // Enforce limits based on plan
    const limits = {
      business: 50,
      enterprise: 100,
    };
    
    const maxDomains = limits[userPlan as keyof typeof limits] || 50;
    
    if (domains.length > maxDomains) {
      return NextResponse.json(
        { 
          error: `Maximum ${maxDomains} domains allowed per request for ${userPlan} plan`,
          provided: domains.length
        },
        { status: 400 }
      );
    }

    // Check if enhanced analysis is allowed
    const canUseEnhanced = enhanced && (userPlan === 'enterprise' || user.role === 'admin');

    // Process domains
    const domainChecker = new DomainCheckerV2();
    const startTime = Date.now();
    
    const results = await domainChecker.checkMultipleDomains(
      domains,
      canUseEnhanced,
      marketContext
    );
    
    const processingTime = Date.now() - startTime;

    // Group results by availability
    const available = results.filter(r => r.available);
    const taken = results.filter(r => !r.available);

    // Calculate statistics
    const stats = {
      total: results.length,
      available: available.length,
      taken: taken.length,
      averageScore: available.length > 0 
        ? Math.round(available.reduce((sum, r) => sum + r.grabScore, 0) / available.length)
        : 0,
      processingTime,
      enhancedAnalysisUsed: canUseEnhanced,
    };

    // Log usage for analytics
    await logBulkOperation(user.id, domains.length, available.length);

    const response = NextResponse.json({
      results: {
        available: available.slice(0, 50), // Limit response size
        taken: taken.map(t => ({
          domain: t.domain,
          whoisData: t.whoisData
        })),
      },
      stats,
      meta: {
        requestId: generateRequestId(),
        timestamp: new Date().toISOString(),
        userPlan,
      }
    });

    return securityHeaders(response);
  } catch (error) {
    console.error('Bulk check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { roles: ['user', 'admin', 'super_admin'] });

// Helper functions
async function getUserPlan(userId: string): Promise<string> {
  // In production, fetch from database
  // For now, return from mock data
  return 'business';
}

async function logBulkOperation(userId: string, domainsChecked: number, availableFound: number) {
  // Log to analytics database
  console.log('Bulk operation:', { userId, domainsChecked, availableFound });
}

function generateRequestId(): string {
  return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}