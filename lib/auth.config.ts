import type { NextAuthConfig } from "next-auth";

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
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "MANAGEMENT";
      }
      return session;
    },
  },
};
