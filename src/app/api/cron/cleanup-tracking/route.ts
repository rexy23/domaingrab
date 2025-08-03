import { NextRequest, NextResponse } from 'next/server';
import { SearchTracker } from '@/lib/search-tracking';

export async function GET(request: NextRequest) {
  // Verify this is called from a trusted source (e.g., cron job)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await SearchTracker.cleanupOldRecords();
    
    return NextResponse.json({
      success: true,
      message: 'Old tracking records cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}