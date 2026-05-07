import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    await connectMongo();

    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { message: "Nhap day du email va password" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Email hoac mat khau sai" },
        { status: 401 }
      );
    }

    const isPasswordValid = user.password === password;
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email hoac mat khau sai" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Chi admin moi duoc dang nhap" },
        { status: 403 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "Thieu JWT_SECRET trong environment" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        userId: user.id.toString(),
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      message: "ok",
      user: {
        id: user.id.toString(),
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Login fail" }, { status: 500 });
  }
}
