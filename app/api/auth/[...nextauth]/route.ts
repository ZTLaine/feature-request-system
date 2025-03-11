import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, UserRole } from "@prisma/client"
import { compare } from "bcryptjs"
import { DefaultUser } from "next-auth"

// Extend the User type to include our custom fields
interface CustomUser extends DefaultUser {
  role: UserRole;
}

// Extend the session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
    }
  }
}

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // If there's no email from the OAuth provider, we can't link accounts
      if (!profile?.email) {
        return true;
      }

      // If we have an account and it's a Google sign-in attempt
      if (account?.provider === "google") {
        // Check if we have an existing user with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
          include: { accounts: true },
        });

        // If there's a user with this email but no Google account linked
        if (existingUser && !existingUser.accounts.some(acc => acc.provider === "google")) {
          // Instead of using a dedicated page, add query parameters to the main page
          // This will be handled by our client components
          return `/?error=OAuthAccountNotLinked&email=${profile.email}`;
        }
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
  // Remove the pages configuration to use the default handling with query params
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }