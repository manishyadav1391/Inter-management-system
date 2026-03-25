import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(
          process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!,
          {
            method: "POST",
            headers: {
              "Content-Type":          "application/json",
              "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET!,
            },
            body: JSON.stringify({
              query: `
                query GetUser($email: String!) {
                  users(where: { email: { _eq: $email } }) {
                    id email password role department_id
                  }
                }
              `,
              variables: { email: credentials.email },
            }),
          }
        );

        const data = await res.json();
        console.log("📦 Hasura response:", JSON.stringify(data));

        const user = data?.data?.users?.[0];
        console.log("👤 User found:", user ? "YES" : "NO");

        if (!user) return null;

        const passwordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        console.log("🔑 Password valid:", passwordValid);

        if (!passwordValid) return null;

        return {
          id:           user.id,
          email:        user.email,
          role:         user.role,
          departmentId: user.department_id,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.role         = (user as any).role;
        token.departmentId = (user as any).departmentId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id                    = token.id as string;
      (session.user as any).role         = token.role;
      (session.user as any).departmentId = token.departmentId;

      // Build Hasura JWT using jose (Edge runtime compatible)
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

      (session as any).hasuraToken = await new SignJWT({
        sub: token.id as string,
        "https://hasura.io/jwt/claims": {
          "x-hasura-default-role":  token.role,
          "x-hasura-allowed-roles": [token.role as string],
          "x-hasura-user-id":       token.id as string,
          "x-hasura-department-id": (token.departmentId as string) ?? "",
        },
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(secret);

      return session;
    },
  },

  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
});