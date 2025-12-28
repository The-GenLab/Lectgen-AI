import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { userRepository } from '../repositories';
import { UserRole, QUOTA } from '../../shared/constants';
import adminSettingsService from '../../modules/admin/admin-settings.service';

// Cấu hình Google OAuth
export const configureGoogleAuth = () => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn(' Google OAuth credentials not configured. Google login will not be available.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          
          let user = await userRepository.findByEmail(email);

          if (user) {
           
            if (!user.googleId) {
              user = await userRepository.update(user.id, {
                googleId: profile.id,
              });
            }
          } else {
            // Tạo user mới từ Google account
            const name = profile.displayName || email.split('@')[0];
            const avatarUrl = profile.photos?.[0]?.value || null;

            user = await userRepository.create({
              email,
              name,
              avatarUrl,
              passwordHash: '', 
              googleId: profile.id,
              role: UserRole.FREE,
              maxSlidesPerMonth: await adminSettingsService.getMonthlyFreeQuota(),
            });
          }

          return done(null, user || undefined);
        } catch (error) {
          console.error('Error in Google OAuth strategy:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

 
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });


  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await userRepository.findById(id);
      done(null, user || undefined);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('Google OAuth configured successfully');
};

export default passport;
