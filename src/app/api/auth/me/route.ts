import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAuth } from "@/lib/auth";
import { getSessionUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const authError = requireAuth(user);
    if (authError) {
      return authError;
    }

    return NextResponse.json({
      user: await getSessionUser(user!),
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
