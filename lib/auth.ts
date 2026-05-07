import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";

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
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthUser;

    if (!payload.userId || !payload.email || !payload.role) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
