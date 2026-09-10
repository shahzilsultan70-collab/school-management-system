import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,

    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      // ==========================================
      // GET JWT FROM AUTHORIZATION HEADER
      // ==========================================

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ==========================================
      // CHECK JWT EXPIRATION
      // ==========================================

      ignoreExpiration: false,

      // ==========================================
      // JWT SECRET
      // ==========================================

      secretOrKey: jwtSecret,
    });
  }

  // ==========================================
  // VALIDATE JWT PAYLOAD
  // ==========================================

  async validate(payload: any) {
    // ==========================================
    // DEBUG JWT PAYLOAD
    // ==========================================

    console.log('====================================');
    console.log('JWT PAYLOAD:', payload);
    console.log('JWT SUB:', payload.sub);
    console.log('JWT ROLE:', payload.role);
    console.log('JWT EMAIL:', payload.email);
    console.log('JWT TOKEN VERSION:', payload.tokenVersion);
    console.log('====================================');

    // ==========================================
    // CHECK USER ID
    // ==========================================

    if (!payload.sub) {
      throw new UnauthorizedException(
        'User ID is missing from authentication token',
      );
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is deactivated');
    }

    // ==========================================
    // CHECK TOKEN VERSION
    // ==========================================

    const currentTokenVersion = user.tokenVersion ?? 0;

    const jwtTokenVersion = payload.tokenVersion ?? 0;

    if (jwtTokenVersion !== currentTokenVersion) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    // ==========================================
    // CREATE USER FULL NAME
    // ==========================================

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // ==========================================
    // AUTHENTICATED USER
    // ==========================================

    const authenticatedUser = {
      sub: user._id.toString(),

      id: user._id.toString(),

      userId: user._id.toString(),

      email: user.email,

      role: user.role,

      name: fullName,

      firstName: user.firstName,

      lastName: user.lastName,

      isActive: user.isActive,

      profilePicture: user.profilePicture ?? null,
    };

    // ==========================================
    // DEBUG AUTHENTICATED USER
    // ==========================================

    console.log('AUTHENTICATED USER:', authenticatedUser);

    // ==========================================
    // THIS BECOMES req.user
    // ==========================================

    return authenticatedUser;
  }
}
