import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { createHash } from 'crypto';

export interface ApiUser {
  id: string;
  userId: string;
  keyName: string;
  subscriptionTier: string;
  rateLimit: number;
}

export class ApiAuth {
  static async authenticateRequest(req: NextRequest): Promise<ApiUser | null> {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const apiKey = authHeader.substring(7);
    
    // Hash the API key for secure comparison
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    
    try {
      // Find the API key
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: hashedKey },
        include: {
          user: {
            select: {
              id: true,
              subscriptionTier: true,
              subscriptionStatus: true,
            }
          }
        }
      });
      
      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return null;
      }
      
      // Update usage statistics
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        }
      });
      
      // Determine rate limit based on subscription
      const rateLimits: Record<string, number> = {
        free: 0, // No API access for free tier
        pro: 1000, // 1,000 calls/month
        business: 10000, // 10,000 calls/month
        enterprise: -1, // Unlimited
      };
      
      return {
        id: apiKeyRecord.id,
        userId: apiKeyRecord.userId,
        keyName: apiKeyRecord.name,
        subscriptionTier: apiKeyRecord.user.subscriptionTier,
        rateLimit: rateLimits[apiKeyRecord.user.subscriptionTier] || 0,
      };
    } catch (error) {
      console.error('API auth error:', error);
      return null;
    }
  }
  
  static generateApiKey(): string {
    const prefix = 'dgrab_';
    const randomBytes = createHash('sha256')
      .update(Date.now().toString() + Math.random().toString())
      .digest('hex');
    
    return prefix + randomBytes.substring(0, 32);
  }
  
  static hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }
}