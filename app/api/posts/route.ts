import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    await connectMongo();
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Nhập đẩy đủ email và Password",
        },
        { status: 400 }
      );
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu sai" },
        { status: 401 }
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Sai emai hoặc mật khẩu" }
      )
    }
    const token = jwt.sign(
      {
        userId: user.id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
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
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Login fail" },
      { status: 500 }
    );
  }
}
