import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback";

export const isGoogleConfigured = () =>
  Boolean(
    GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_SECRET &&
    GOOGLE_CLIENT_ID !== "your_google_client_id_here" &&
    GOOGLE_CLIENT_SECRET !== "your_google_client_secret_here"
  );

if (isGoogleConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName || email?.split("@")[0] || "Google User";
        const avatar = profile.photos?.[0]?.value ?? null;

        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        // 1. Tim theo googleId
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (user) {
          // Cap nhat avatar neu thay doi
          if (avatar && user.avatar !== avatar) {
            user = await prisma.user.update({ where: { id: user.id }, data: { avatar } });
          }
          return done(null, user);
        }

        // 2. Tim theo email (tai khoan cu co the link voi Google)
        const existingByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingByEmail) {
          // Link Google vao tai khoan hien co
          user = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { googleId, avatar: avatar ?? existingByEmail.avatar },
          });
          return done(null, user);
        }

        // 3. Tao user moi
        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            avatar,
            password: null,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
} else {
  console.log("ℹ️ [Passport] Google OAuth chưa được cấu hình Client ID / Secret trong .env. Tính năng Google Login tạm tắt.");
}

export default passport;