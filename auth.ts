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
            id:                     true,
            name:                   true,
            email:                  true,
            password:               true,
            role:                   true,
            isActive:               true,
            isVerified:             true,
            verificationToken:      true,
            organisationId:         true,
            hasCompletedOnboarding: true,
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

        // Resolve org name once at login — cheap single query, stored in JWT.
        let orgName: string | null = null;
        if (user.organisationId) {
          const org = await prisma.organisation.findUnique({
            where: { id: user.organisationId },
            select: { name: true },
          });
          orgName = org?.name ?? null;
        }

        return {
          id:                     user.id,
          name:                   user.name,
          email:                  user.email,
          role:                   user.role,
          organisationId:         user.organisationId,
          isVerified:             user.isVerified,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          orgName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      // ── First login: populate all custom fields from the user object ────────
      if (user) {
        token.name                   = (user as any).name  ?? null;
        token.email                  = (user as any).email ?? null;
        token.role                   = (user as any).role;
        token.id                     = (user.id as string) ?? "";
        token.organisationId         = (user as any).organisationId ?? null;
        token.isVerified             = (user as any).isVerified ?? false;
        token.hasCompletedOnboarding = (user as any).hasCompletedOnboarding ?? false;
        token.orgName                = (user as any).orgName ?? null;
      }

      // ── updateSession() calls: merge only the fields that were passed ───────
      if (trigger === "update" && updateData) {
        if (updateData.hasCompletedOnboarding !== undefined)
          token.hasCompletedOnboarding = updateData.hasCompletedOnboarding;
        if (updateData.name !== undefined)
          token.name = updateData.name;
        if (updateData.orgName !== undefined)
          token.orgName = updateData.orgName;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Explicitly surface all custom fields — never rely on NextAuth's
        // auto-population since it can silently drop values on token refresh.
        session.user.name                            = (token.name as string) ?? null;
        session.user.email                           = (token.email as string) ?? null;
        (session.user as any).role                   = token.role;
        (session.user as any).id                     = token.id;
        (session.user as any).organisationId         = token.organisationId ?? null;
        (session.user as any).isVerified             = token.isVerified ?? false;
        (session.user as any).hasCompletedOnboarding = token.hasCompletedOnboarding ?? false;
        (session.user as any).orgName                = token.orgName ?? null;
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
