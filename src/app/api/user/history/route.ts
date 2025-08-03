import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's search history
    const { data: searches, error } = await supabase
      .from('search_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching search history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      searches: searches || [],
      meta: {
        total: searches?.length || 0,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('Search history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchIds } = await request.json();

    if (!searchIds || !Array.isArray(searchIds)) {
      return NextResponse.json(
        { error: 'Search IDs are required' },
        { status: 400 }
      );
    }

    // Delete specified searches
    const { error } = await supabase
      .from('search_logs')
      .delete()
      .eq('user_id', session.user.id)
      .in('id', searchIds);

    if (error) {
      console.error('Error deleting search history:', error);
      return NextResponse.json(
        { error: 'Failed to delete search history' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Search history deleted successfully' });
  } catch (error) {
    console.error('Delete search history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}