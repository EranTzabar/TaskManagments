import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, signAuthToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (typeof body.username !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "שם משתמש וסיסמה נדרשים" }, { status: 400 });
    }

    const username = body.username.trim();
    if (!username || !body.password) {
      return NextResponse.json({ error: "שם משתמש וסיסמה נדרשים" }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ username });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
    }

    const authUser = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const token = await signAuthToken(authUser);
    const response = NextResponse.json({
      user: { username: authUser.username, role: authUser.role },
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);

    if (error instanceof Error && error.message === "JWT_SECRET_MISSING") {
      return NextResponse.json(
        { error: "JWT_SECRET לא מוגדר בשרת. הוסף משתנה סביבה באורך 32 תווים לפחות." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "שגיאה בהתחברות" }, { status: 500 });
  }
}
