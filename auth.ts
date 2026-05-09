import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/models/User";

type AdminProfile = {
  _id: { toString(): string };
  name?: string;
  avatarUrl?: string;
};

async function findAdminByEmail(email?: string | null) {
  if (!email) {
    return null;
  }

  await connectMongo();

  return User.findOne({
    email: email.toLowerCase(),
    role: "admin",
  }).lean<AdminProfile>();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return false;
      }

      const admin = await findAdminByEmail(user.email);
      return Boolean(admin);
    },
    async session({ session }) {
      const admin = await findAdminByEmail(session.user?.email);

      if (admin && session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: "admin";
          avatarUrl?: string;
        };

        sessionUser.id = admin._id.toString();
        sessionUser.role = "admin";
        sessionUser.name = admin.name || sessionUser.name;
        sessionUser.image = admin.avatarUrl || sessionUser.image;
        sessionUser.avatarUrl = admin.avatarUrl;
      }

      return session;
    },
  },
});
