import { NextRequest, NextResponse } from 'next/server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';
import { ApiAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/stripe-client';

// GET: List user's API keys
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Check if user has API access
    const userPlan = await getUserPlan(user.id);
    
    if (userPlan === 'free') {
      return NextResponse.json(
        { 
          error: 'API access is not available on the Free plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        key: true, // This is hashed
        usageCount: true,
        lastUsed: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Mask the keys for security
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: `dgrab_****${key.key.substring(key.key.length - 4)}`,
    }));
    
    const response = NextResponse.json({
      apiKeys: maskedKeys,
      limits: {
        maxKeys: userPlan === 'pro' ? 2 : userPlan === 'business' ? 5 : 10,
        currentCount: apiKeys.length,
      }
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('API keys fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
});

// POST: Create new API key
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { name } = await req.json();
    
    if (!name || typeof name !== 'string' || name.length < 3) {
      return NextResponse.json(
        { error: 'Invalid key name' },
        { status: 400 }
      );
    }
    
    // Check user plan
    const userPlan = await getUserPlan(user.id);
    
    if (userPlan === 'free') {
      return NextResponse.json(
        { 
          error: 'API access is not available on the Free plan',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }
    
    // Check key limits
    const keyLimits: Record<string, number> = {
      pro: 2,
      business: 5,
      enterprise: 10,
    };
    
    const currentKeyCount = await prisma.apiKey.count({
      where: { userId: user.id }
    });
    
    const maxKeys = keyLimits[userPlan] || 2;
    
    if (currentKeyCount >= maxKeys) {
      return NextResponse.json(
        { 
          error: `Maximum ${maxKeys} API keys allowed for ${userPlan} plan`,
          currentCount: currentKeyCount
        },
        { status: 400 }
      );
    }
    
    // Generate new API key
    const rawApiKey = ApiAuth.generateApiKey();
    const hashedKey = ApiAuth.hashApiKey(rawApiKey);
    
    // Save to database
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: hashedKey,
      }
    });
    
    const response = NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawApiKey, // Only time we return the raw key
      message: 'Save this API key securely. It will not be shown again.',
      usage: {
        endpoint: 'https://domaingrab.eu/api/v1/domains/check',
        header: 'Authorization: Bearer ' + rawApiKey,
      }
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
});

// DELETE: Revoke API key
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID required' },
        { status: 400 }
      );
    }
    
    // Verify ownership
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
      }
    });
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }
    
    // Delete the key
    await prisma.apiKey.delete({
      where: { id: keyId }
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('API key deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
});

async function getUserPlan(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true }
  });
  
  return user?.subscriptionTier || 'free';
}