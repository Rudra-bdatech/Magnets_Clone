import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { dbConnect } from "@/lib/mongodb";
import { AccountModel } from "@/lib/models";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      issuer: "https://www.linkedin.com",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
        async request(context) {
          const res = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
          });
          return res.json();
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
          email: profile.email,
          image: profile.picture || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account: oauthAccount }) {
      if (!user.email) return false;

      try {
        await dbConnect();
        const cleanEmail = user.email.trim().toLowerCase();
        const isLinkedIn = oauthAccount?.provider === "linkedin";

        // Check if user account already exists in MongoDB
        let existing = await AccountModel.findOne({ email: cleanEmail });

        if (!existing) {
          const baseName = user.name || user.email.split("@")[0];
          const rawUsername = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "user";
          let generatedUsername = rawUsername;

          const existingUsername = await AccountModel.findOne({ username: generatedUsername });
          if (existingUsername) {
            generatedUsername = `${rawUsername}${Math.floor(1000 + Math.random() * 9000)}`;
          }

          await AccountModel.create({
            name: user.name || (isLinkedIn ? "LinkedIn User" : "Google User"),
            email: cleanEmail,
            username: generatedUsername,
            password: "",
            plan: "Free",
            brandColor: "#0066B2",
            logo: null,
            avatar: user.image || null,
            joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            isNewAccount: true,
            // If signing up via LinkedIn OAuth, mark their LinkedIn as connected for identity
            ...(isLinkedIn && {
              linkedinConnected: true,
              linkedinAccountName: user.name || "",
              linkedinProfileImage: user.image || "",
              linkedinAccountId: oauthAccount.providerAccountId || "",
              linkedinProfileId: oauthAccount.providerAccountId || "",
            }),
          });
        } else {
          let modified = false;
          if (user.image && existing.avatar !== user.image) {
            existing.avatar = user.image;
            modified = true;
          }
          if (
            existing.logo &&
            (existing.logo === user.image ||
              existing.logo.includes("googleusercontent.com") ||
              existing.logo.includes("media.licdn.com"))
          ) {
            existing.logo = null;
            modified = true;
          }
          // If user signs in via LinkedIn OAuth, update their LinkedIn identity info
          if (isLinkedIn) {
            existing.linkedinConnected = true;
            existing.linkedinAccountName = user.name || existing.linkedinAccountName || "";
            existing.linkedinProfileImage = user.image || existing.linkedinProfileImage || "";
            existing.linkedinAccountId = oauthAccount.providerAccountId || existing.linkedinAccountId || "";
            existing.linkedinProfileId = oauthAccount.providerAccountId || existing.linkedinProfileId || "";
            modified = true;
          }
          if (modified) {
            await existing.save();
          }
        }
        return true;
      } catch (err) {
        console.error("Error saving OAuth user to database:", err);
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email?.trim().toLowerCase();
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url && url.startsWith("/")) return `${baseUrl}${url}`;
      if (url && new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/register/onboarding`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      if (code === "JWT_SESSION_ERROR" || (metadata as any)?.name === "JWEDecryptionFailed" || (metadata as any)?.message?.includes("decryption")) {
        return; // Suppress noisy stale cookie stack traces in dev terminal
      }
      console.error(`[next-auth][${code}]`, metadata);
    },
    warn(code) {
      if ((code as string) === "JWT_SESSION_ERROR") return;
      console.warn(`[next-auth][${code}]`);
    },
  },
};
