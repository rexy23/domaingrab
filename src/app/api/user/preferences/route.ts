import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, subscription_tier, subscription_status')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
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
      enhancedAnalysis: user.subscription_tier !== 'free',
    };

    return NextResponse.json({
      preferences,
      userTier: user.subscription_tier,
      subscriptionStatus: user.subscription_status,
    });
  } catch (error) {
    console.error('Get preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // For now, just validate the user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: Store preferences in database
    // await supabase.from('user_preferences').upsert({ user_id: session.user.id, preferences });

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Update preferences API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}