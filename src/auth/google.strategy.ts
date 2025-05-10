// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { AuthService } from './auth.service';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(GoogleStrategy, 'google') {
//   constructor(private authService: AuthService) {
//     super({
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//       scope: ['email', 'profile'],
//     });
//   }

//   async validate(accessToken: string, refreshToken: string, profile: any) {
//     const { email, displayName } = profile;

//     // Check if user already exists in DB, if not, create one
//     const user = await this.authService.findOrCreateUser({
//       email,
//       fullName: displayName,
//       role: 'INDEPENDENT',
//     });

//     return user;
//   }
// }
