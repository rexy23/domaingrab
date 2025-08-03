import { redis } from './redis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface UserRateLimitConfig extends RateLimitConfig {
  tierMultipliers: {
    free: number;
    pro: number;
    business: number;
    enterprise: number;
  };
}

export class EnhancedRateLimiter {
  private config: UserRateLimitConfig;

  constructor(config: UserRateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => `rate_limit:${id}`,
      ...config,
    };
  }

  /**
   * Get rate limit based on user's subscription tier
   */
  private getUserLimit(tier: string): number {
    const multiplier = this.config.tierMultipliers[tier as keyof typeof this.config.tierMultipliers] || 1;
    return Math.floor(this.config.maxRequests * multiplier);
  }

  /**
   * Check rate limit for authenticated users
   */
  async checkUserLimit(userId: string, tier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
  }> {
    const limit = this.getUserLimit(tier);
    const key = this.config.keyGenerator!(`user:${userId}`);
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    try {
      const current = await redis.get(windowKey);
      const count = current ? parseInt(current as string) : 0;

      if (count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: (window + 1) * this.config.windowMs,
          limit,
        };
      }

      // Increment counter
      await redis.incr(windowKey);
      await redis.expire(windowKey, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: true,
        remaining: limit - (count + 1),
        resetTime: (window + 1) * this.config.windowMs,
        limit,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + this.config.windowMs,
        limit,
      };
    }
  }

  /**
   * Check rate limit for anonymous users (IP-based)
   */
  async checkIPLimit(ip: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
  }> {
    const limit = this.config.maxRequests;
    const key = this.config.keyGenerator!(`ip:${ip}`);
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    try {
      const current = await redis.get(windowKey);
      const count = current ? parseInt(current as string) : 0;

      if (count >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: (window + 1) * this.config.windowMs,
          limit,
        };
      }

      // Increment counter
      await redis.incr(windowKey);
      await redis.expire(windowKey, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: true,
        remaining: limit - (count + 1),
        resetTime: (window + 1) * this.config.windowMs,
        limit,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + this.config.windowMs,
        limit,
      };
    }
  }

  /**
   * Smart rate limit check - uses user ID if authenticated, otherwise IP
   */
  async checkLimit(identifier: string, session?: any): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
    type: 'user' | 'ip';
  }> {
    if (session?.user?.id) {
      const result = await this.checkUserLimit(
        session.user.id,
        session.user.subscriptionTier || 'free'
      );
      return { ...result, type: 'user' };
    } else {
      const result = await this.checkIPLimit(identifier);
      return { ...result, type: 'ip' };
    }
  }
}

// Pre-configured rate limiters with tier-based limits
export const enhancedSearchRateLimit = new EnhancedRateLimiter({
  maxRequests: 20, // Base limit for free tier
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (id: string) => `search_limit:${id}`,
  tierMultipliers: {
    free: 1,      // 20 searches/hour
    pro: 5,       // 100 searches/hour
    business: 25, // 500 searches/hour
    enterprise: -1, // Unlimited (handled separately)
  },
});

export const enhancedApiRateLimit = new EnhancedRateLimiter({
  maxRequests: 60, // Base limit for free tier
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (id: string) => `api_limit:${id}`,
  tierMultipliers: {
    free: 1,        // 60 requests/minute
    pro: 3,         // 180 requests/minute
    business: 10,   // 600 requests/minute
    enterprise: 50, // 3000 requests/minute
  },
});

export const enhancedDomainAnalysisLimit = new EnhancedRateLimiter({
  maxRequests: 5, // Base limit for free tier
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  keyGenerator: (id: string) => `analysis_limit:${id}`,
  tierMultipliers: {
    free: 1,      // 5 enhanced analyses/day
    pro: 10,      // 50 enhanced analyses/day
    business: 50, // 250 enhanced analyses/day
    enterprise: -1, // Unlimited
  },
});