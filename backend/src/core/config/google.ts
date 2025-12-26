import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import passport from 'passport';
import authService from '../../modules/auth/auth.service';

// Configure Google OAuth strategy with state validation
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    passReqToCallback: true, // Enable access to req in verify callback
},
    async function (req: any, accessToken: string, refreshToken: string, profile: Profile, cb: VerifyCallback) {
        try {
            // Validate OAuth state parameter for CSRF protection
            const state = req.query.state as string;
            
            if (!state) {
                return cb(new Error('Missing OAuth state parameter'), undefined);
            }

            const isValidState = await authService.validateOAuthState(state);
            
            if (!isValidState) {
                return cb(new Error('Invalid or expired OAuth state'), undefined);
            }

            // Lấy thông tin cơ bản từ Google
            const googleUser = {
                googleId: profile.id,
                email: profile.emails?.[0]?.value || '',
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value || '',
            };
            
            const user = {
                id: googleUser.googleId,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.avatar,
            };

            return cb(null, user);
        } catch (error) {
            return cb(error as Error, undefined);
        }
    }
));

export default passport;