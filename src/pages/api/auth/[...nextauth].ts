import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("No user found");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          chesscomUsername: user.chesscomUsername,
          lichessUsername: user.lichessUsername,
          timeSettings: user.timeSettings,
          analysisSettings: user.analysisSettings,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Trigger auto-import if enabled (non-blocking)
      if (user?.id) {
        // Check user settings
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            autoImportEnabled: true,
            autoImportInterval: true,
            lastAutoImport: true,
          },
        });

        if (userData?.autoImportEnabled && userData.lastAutoImport) {
          const timeSinceLastImport =
            (Date.now() - new Date(userData.lastAutoImport).getTime()) / 1000;
          const interval = userData.autoImportInterval || 21600;

          // Only trigger if interval has passed
          if (timeSinceLastImport >= interval) {
            // Trigger auto-import in background (fire and forget)
            fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/auto-import`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }).catch((error) => console.error("Auto-import on login failed:", error));
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.chesscomUsername = token.chesscomUsername as string | null;
        session.user.lichessUsername = token.lichessUsername as string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).timeSettings = token.timeSettings;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).analysisSettings = token.analysisSettings;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // Allow updating session data from client
        return { ...token, ...session.user };
      }
      if (user) {
        token.sub = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.chesscomUsername = (user as any).chesscomUsername;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.lichessUsername = (user as any).lichessUsername;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.timeSettings = (user as any).timeSettings;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.analysisSettings = (user as any).analysisSettings;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export default NextAuth(authOptions);
