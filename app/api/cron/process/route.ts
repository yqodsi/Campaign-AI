import { NextRequest, NextResponse } from "next/server";
import { processActiveCampaigns } from "@/lib/services/email-scheduler.service";

export const dynamic = 'force-dynamic';

// This route supports external crons, the worker heartbeat, or a manual click.

export async function GET(request: NextRequest) {
  // Allow GET so you can hit it from a browser
  return POST(request);
}

export async function POST(request: NextRequest) {
  // Optionally require a secret outside of local dev
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await processActiveCampaigns();
    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
      message:
        "Campaigns processed successfully. Check worker logs for email generation.",
    });
  } catch (error) {
    console.error("[Cron] Error processing campaigns:", error);
    return NextResponse.json(
      {
        error: "Processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
