import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth";
import { syncPresence } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string | null;
    };

    const result = await syncPresence(body.sessionId ?? null);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/sessions/sync failed:", error);
    return NextResponse.json(
      { error: "Failed to sync presence session" },
      { status: 500 }
    );
  }
}
