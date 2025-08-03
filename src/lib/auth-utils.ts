import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return session;
}

export async function requireSubscription(tier: string = 'pro') {
  const session = await requireAuth();
  
  const allowedTiers = ['pro', 'business', 'enterprise'];
  const tierIndex = allowedTiers.indexOf(tier);
  const userTierIndex = allowedTiers.indexOf(session.user.subscriptionTier);
  
  if (userTierIndex < tierIndex || session.user.subscriptionStatus !== 'active') {
    redirect('/pricing');
  }
  
  return session;
}

export function hasFeatureAccess(session: any, feature: string): boolean {
  const features = {
    enhanced_analysis: ['pro', 'business', 'enterprise'],
    bulk_search: ['business', 'enterprise'],
    api_access: ['business', 'enterprise'],
    white_label: ['enterprise'],
  };
  
  const requiredTiers = features[feature as keyof typeof features];
  if (!requiredTiers) return false;
  
  return requiredTiers.includes(session.user.subscriptionTier) && 
         session.user.subscriptionStatus === 'active';
}