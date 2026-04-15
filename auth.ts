import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id:               true,
            name:             true,
            email:            true,
            password:         true,
            role:             true,
            isActive:         true,
            isVerified:       true,
            verificationToken: true,
            organisationId:   true,
          },
        });

        if (!user || !user.isActive) return null;

        // Block login for users who registered via the new flow but haven't
        // verified their email yet. Existing seed users have
        // verificationToken = null so they are never blocked.
        if (!user.isVerified && user.verificationToken !== null) {
          throw new Error("Please verify your email before signing in.");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        return {
          id:             user.id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          organisationId: user.organisationId,
          isVerified:     user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role           = (user as any).role;
        token.id             = (user.id as string) ?? "";
        token.organisationId = (user as any).organisationId ?? null;
        token.isVerified     = (user as any).isVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role           = token.role;
        (session.user as any).id             = token.id;
        (session.user as any).organisationId = token.organisationId ?? null;
        (session.user as any).isVerified     = token.isVerified ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
