import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/lib/auth";
import { deleteUser, updateUser, validatePassword, validateUserRole } from "@/lib/users";
import { UserUpdatePayload } from "@/lib/types";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    const body = (await request.json()) as UserUpdatePayload;

    if (body.role !== undefined && !validateUserRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (body.password !== undefined && body.password !== "") {
      const passwordError = validatePassword(body.password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }
    }

    const updated = await updateUser(params.id, body, user!.id);
    return NextResponse.json({ user: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    console.error(`PATCH /api/users/${params.id} failed:`, error);

    if (message === "User not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    const adminError = requireAdmin(user);
    if (adminError) {
      return adminError;
    }

    await deleteUser(params.id, user!.id);
    return NextResponse.json({ id: params.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    console.error(`DELETE /api/users/${params.id} failed:`, error);

    if (message === "User not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
