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
    const action = searchParams.get('action'); // watched, owned, ignored, interested

    // Build query
    let query = supabase
      .from('user_domains')
      .select(`
        id,
        action,
        notes,
        purchase_price,
        current_value,
        created_at,
        updated_at,
        domain:domain_intelligence(*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (action) {
      query = query.eq('action', action);
    }

    const { data: userDomains, error } = await query;

    if (error) {
      console.error('Error fetching user domains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved domains' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      domains: userDomains || [],
      meta: {
        total: userDomains?.length || 0,
        filterBy: action,
      },
    });
  } catch (error) {
    console.error('Get user domains API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain, action, notes, purchasePrice, currentValue } = await request.json();

    if (!domain || !action) {
      return NextResponse.json(
        { error: 'Domain and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['watched', 'owned', 'ignored', 'interested'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
        { status: 400 }
      );
    }

    // First, ensure the domain exists in domain_intelligence table
    const { data: existingDomain, error: domainError } = await supabase
      .from('domain_intelligence')
      .select('id')
      .eq('domain', domain)
      .single();

    let domainId = existingDomain?.id;

    // If domain doesn't exist, create it with basic info
    if (!existingDomain) {
      const tld = domain.split('.').pop() || '';
      const { data: newDomain, error: createError } = await supabase
        .from('domain_intelligence')
        .insert({
          domain,
          tld,
          status: 'pending_analysis',
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating domain record:', createError);
        return NextResponse.json(
          { error: 'Failed to create domain record' },
          { status: 500 }
        );
      }

      domainId = newDomain.id;
    }

    // Create or update user domain relationship
    const { data: userDomain, error } = await supabase
      .from('user_domains')
      .upsert({
        user_id: session.user.id,
        domain_id: domainId,
        action,
        notes: notes || null,
        purchase_price: purchasePrice || null,
        current_value: currentValue || null,
      })
      .select(`
        id,
        action,
        notes,
        purchase_price,
        current_value,
        created_at,
        updated_at,
        domain:domain_intelligence(*)
      `)
      .single();

    if (error) {
      console.error('Error saving user domain:', error);
      return NextResponse.json(
        { error: 'Failed to save domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Domain saved successfully',
      userDomain,
    });
  } catch (error) {
    console.error('Save user domain API error:', error);
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

    const { userDomainId } = await request.json();

    if (!userDomainId) {
      return NextResponse.json(
        { error: 'User domain ID is required' },
        { status: 400 }
      );
    }

    // Delete user domain relationship
    const { error } = await supabase
      .from('user_domains')
      .delete()
      .eq('id', userDomainId)
      .eq('user_id', session.user.id); // Ensure user can only delete their own domains

    if (error) {
      console.error('Error deleting user domain:', error);
      return NextResponse.json(
        { error: 'Failed to delete domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Domain removed successfully' });
  } catch (error) {
    console.error('Delete user domain API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}