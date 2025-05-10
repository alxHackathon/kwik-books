// import { Strategy as AppleStrategy } from 'passport-apple';
// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { AuthService } from './auth.service';

// @Injectable()
// export class AppleStrategy extends PassportStrategy(AppleStrategy, 'apple') {
//   constructor(private authService: AuthService) {
//     super({
//       clientID: process.env.APPLE_CLIENT_ID,
//       teamID: process.env.APPLE_TEAM_ID,
//       keyID: process.env.APPLE_KEY_ID,
//       privateKey: process.env.APPLE_PRIVATE_KEY,
//       callbackURL: process.env.APPLE_CALLBACK_URL,
//     });
//   }

//   async validate(accessToken: string, refreshToken: string, profile: any) {
//     const { email, firstName, lastName } = profile;


//     const user = await this.authService.findOrCreateUser({
//       email,
//       fullName: `${firstName} ${lastName}`,
//       role: 'INDEPENDENT',
//     });

//     return user;
//   }
// }
