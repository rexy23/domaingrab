import { NextRequest, NextResponse } from 'next/server';
import { withAuth, securityHeaders } from '@/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UserPreferences {
  defaultTlds: string[];
  maxResults: number;
  enhancedAnalysis: boolean;
  notifications: {
    email: boolean;
    alerts: boolean;
    newsletter: boolean;
  };
  filters: {
    minLength: number;
    maxLength: number;
    allowNumbers: boolean;
    allowHyphens: boolean;
    minGrabScore: number;
  };
  marketPreferences: {
    targetCountries: string[];
    preferredIndustries: string[];
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultTlds: ['eu', 'de', 'uk', 'fr', 'nl'],
  maxResults: 50,
  enhancedAnalysis: false,
  notifications: {
    email: true,
    alerts: true,
    newsletter: false,
  },
  filters: {
    minLength: 3,
    maxLength: 15,
    allowNumbers: false,
    allowHyphens: false,
    minGrabScore: 60,
  },
  marketPreferences: {
    targetCountries: ['EU', 'UK', 'DE', 'FR'],
    preferredIndustries: ['Technology', 'Business'],
  },
};

export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    // Get user preferences from database - user can only access their own data
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, return default preferences
    // In a full implementation, you'd store these in a separate preferences table
    const preferences = {
      ...DEFAULT_PREFERENCES,
      // Enable enhanced analysis for premium users
      enhancedAnalysis: userData.subscription_tier !== 'free',
    };

    const response = NextResponse.json({
      preferences,
      userTier: userData.subscription_tier,
      subscriptionStatus: userData.subscription_status,
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('Get preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, user) => {
  try {
    const preferences = await request.json();

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // In a full implementation, you'd validate each preference field
    // and store them in a preferences table
    
    // For now, just validate the user exists - user can only update their own preferences
    const { data: userData, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Store preferences in database
    // await supabase.from('user_preferences').upsert({ user_id: user.id, preferences });

    const response = NextResponse.json({
      message: 'Preferences updated successfully',
      preferences,
    });
    
    return securityHeaders(response);
  } catch (error) {
    console.error('Update preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});