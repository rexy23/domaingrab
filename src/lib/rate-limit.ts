import { redis } from './redis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (id: string) => `rate_limit:${id}`,
      ...config,
    };
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator!(identifier);
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    try {
      const current = await redis.get(windowKey);
      const count = current ? parseInt(current as string) : 0;

      if (count >= this.config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: (window + 1) * this.config.windowMs,
        };
      }

      // Increment counter
      await redis.incr(windowKey);
      await redis.expire(windowKey, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: true,
        remaining: this.config.maxRequests - (count + 1),
        resetTime: (window + 1) * this.config.windowMs,
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }
}

// Pre-configured rate limiters for different use cases
export const searchRateLimit = new RateLimiter({
  maxRequests: 60, // 60 searches per hour for free users
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (id: string) => `search_limit:${id}`,
});

export const apiRateLimit = new RateLimiter({
  maxRequests: 100, // 100 API calls per minute
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (id: string) => `api_limit:${id}`,
});

export const signupRateLimit = new RateLimiter({
  maxRequests: 5, // 5 signups per hour per IP
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: (id: string) => `signup_limit:${id}`,
});