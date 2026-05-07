import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { auth } from "@/auth";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";

export type AuthUser = JwtPayload & {
  userId: string;
  email: string;
  role: "admin" | "user";
};

export async function getAuthUser() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  const token = (await cookies()).get("token")?.value;
  if (token) {
    try {
      const payload = jwt.verify(token, secret) as AuthUser;

      if (!payload.userId || !payload.email || payload.role !== "admin") {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  await connectMongo();
  const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });

  if (!user) {
    return null;
  }

  return {
    userId: user.id.toString(),
    email: user.email,
    role: "admin",
  };
}
