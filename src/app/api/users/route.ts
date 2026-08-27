import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { createUser, getUsers, validatePassword, validateUserRole, validateUsername } from "@/lib/users";
import { UserCreatePayload } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users failed:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as UserCreatePayload;
    const usernameError = validateUsername(body.username ?? "");
    if (usernameError) {
      return NextResponse.json({ error: usernameError }, { status: 400 });
    }

    const passwordError = validatePassword(body.password ?? "");
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    if (!validateUserRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const created = await createUser(body);
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    console.error("POST /api/users failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
