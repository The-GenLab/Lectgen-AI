import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import passport from 'passport';
//file cau hinh passport cho google oauth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
},
    async function (accessToken, refreshToken, profile: Profile, cb) {
        //Profile chứa thông tin người dùng từ Google
        //Cb la là callback để trả về kết quả xác thực
        try {
            // Lấy thông tin cơ bản từ Google
            const googleUser = {
                googleId: profile.id,
                email: profile.emails?.[0]?.value || '',
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value || '',
            };
            //
            const user = {
                id: googleUser.googleId,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.avatar,
            };

            return cb(null, user);
            //tra ve user cho passport de xu ly tiep
        } catch (error) {
            return cb(error as Error, undefined);
        }
    }
));

export default passport;