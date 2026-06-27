import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/app/generated/prisma/client";

const SESSION_MAX_AGE = 24 * 60 * 60;

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};
