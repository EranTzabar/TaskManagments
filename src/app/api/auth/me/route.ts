import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    return NextResponse.json({
      user: { username: user!.username, role: user!.role },
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
