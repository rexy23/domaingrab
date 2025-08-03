import { createHash } from 'crypto';
import { prisma } from './prisma';

interface SearchTrackingData {
  ipAddress: string;
  userAgent: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  userId?: string;
}

export class SearchTracker {
  // Generate a device fingerprint based on multiple factors
  private static generateFingerprint(data: SearchTrackingData): string {
    const fingerprintData = [
      data.ipAddress,
      data.userAgent,
      data.acceptLanguage || '',
      data.acceptEncoding || '',
    ].join('|');
    
    return createHash('sha256').update(fingerprintData).digest('hex');
  }

  // Get real IP address considering proxies and load balancers
  static getRealIP(headers: Headers): string {
    // Check various headers that might contain the real IP
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Take the first IP in the chain (original client)
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to remote address
    return headers.get('x-remote-addr') || 'unknown';
  }

  // Track a search attempt
  static async trackSearch(data: SearchTrackingData): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const fingerprint = this.generateFingerprint(data);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For authenticated users, check their account limits
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { subscriptionTier: true }
      });

      // If user has a paid plan, allow unlimited searches
      if (user && user.subscriptionTier !== 'free') {
        return { allowed: true, remaining: -1, resetTime: tomorrow };
      }
    }

    // Check IP-based tracking
    const ipTrack = await prisma.searchTracking.findFirst({
      where: {
        ipAddress: data.ipAddress,
        createdAt: { gte: today }
      }
    });

    // Check fingerprint-based tracking
    const fingerprintTrack = await prisma.searchTracking.findFirst({
      where: {
        deviceFingerprint: fingerprint,
        createdAt: { gte: today }
      }
    });

    // Get the higher count between IP and fingerprint
    const ipCount = ipTrack?.searchCount || 0;
    const fingerprintCount = fingerprintTrack?.searchCount || 0;
    const currentCount = Math.max(ipCount, fingerprintCount);

    const limit = 5; // Free tier limit
    
    if (currentCount >= limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: tomorrow 
      };
    }

    // Record the search
    await prisma.searchTracking.create({
      data: {
        ipAddress: data.ipAddress,
        deviceFingerprint: fingerprint,
        userAgent: data.userAgent,
        userId: data.userId,
        searchCount: currentCount + 1,
      }
    });

    // Also update existing records
    if (ipTrack) {
      await prisma.searchTracking.update({
        where: { id: ipTrack.id },
        data: { searchCount: currentCount + 1 }
      });
    }

    if (fingerprintTrack && fingerprintTrack.id !== ipTrack?.id) {
      await prisma.searchTracking.update({
        where: { id: fingerprintTrack.id },
        data: { searchCount: currentCount + 1 }
      });
    }

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetTime: tomorrow
    };
  }

  // Clean up old tracking records (run daily)
  static async cleanupOldRecords(): Promise<void> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await prisma.searchTracking.deleteMany({
      where: {
        createdAt: { lt: threeDaysAgo }
      }
    });
  }
}