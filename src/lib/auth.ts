import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AuthUser, UserRole } from "./types";

export const AUTH_COOKIE_NAME = "auth_token";
const TOKEN_EXPIRY = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET_MISSING");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const id = payload.sub;
    const username = payload.username;
    const role = payload.role;

    if (
      typeof id !== "string" ||
      typeof username !== "string" ||
      (role !== "admin" && role !== "user")
    ) {
      return null;
    }

    return { id, username, role: role as UserRole };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function getTokenFromCookieValue(value: string | undefined): string | null {
  return value ?? null;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const token = getTokenFromCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
}

export async function getAuthenticatedUserFromCookies(): Promise<AuthUser | null> {
  const token = getTokenFromCookieValue(cookies().get(AUTH_COOKIE_NAME)?.value);
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function requireAuth(user: AuthUser | null): NextResponse | null {
  return user ? null : unauthorizedResponse();
}

export function requireAdmin(user: AuthUser | null): NextResponse | null {
  const authError = requireAuth(user);
  if (authError) {
    return authError;
  }
  return user!.role === "admin" ? null : forbiddenResponse();
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}
