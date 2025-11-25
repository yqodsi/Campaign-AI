import { NextRequest, NextResponse } from 'next/server';
import { processActiveCampaigns } from '@/lib/services/email-scheduler.service';

// This endpoint can be called by:
// 1. External cron service (e.g., cron-job.org, Vercel Cron)
// 2. Internal setInterval in worker
// 3. Manual trigger for testing

export async function GET(request: NextRequest) {
  // Allow GET for easy browser testing
  return POST(request);
}

export async function POST(request: NextRequest) {
  // Optional: Verify cron secret (only in production)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processActiveCampaigns();
    return NextResponse.json({ 
      success: true, 
      processedAt: new Date().toISOString(),
      message: 'Campaigns processed successfully. Check worker logs for email generation.'
    });
  } catch (error) {
    console.error('[Cron] Error processing campaigns:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

