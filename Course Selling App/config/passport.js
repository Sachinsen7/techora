const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { UserModel } = require("../db/db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "https://techora-1.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth Profile:", {
          id: profile.id,
          email: profile.emails[0]?.value,
          name: profile.displayName,
        });

        let user = await UserModel.findOne({ googleId: profile.id });

        if (user) {
          console.log("Existing Google user found:", user.email);
          return done(null, user);
        }

        const email = profile.emails[0]?.value;
        user = await UserModel.findOne({ email: email });

        if (user) {
          user.googleId = profile.id;
          user.profilePicture = user.profilePicture || profile.photos[0]?.value;
          await user.save();
          console.log("Linked Google account to existing user:", user.email);
          return done(null, user);
        }

        // Create new user
        const newUser = await UserModel.create({
          googleId: profile.id,
          email: email,
          firstName:
            profile.name?.givenName ||
            profile.displayName?.split(" ")[0] ||
            "User",
          lastName:
            profile.name?.familyName ||
            profile.displayName?.split(" ")[1] ||
            "",
          profilePicture: profile.photos[0]?.value,
          role: "learner",
          isEmailVerified: true,
        });

        console.log("Created new Google user:", newUser.email);
        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth Error:", error);
        return done(error, null);
      }
    }
  )
);

console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await UserModel.findById(payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
