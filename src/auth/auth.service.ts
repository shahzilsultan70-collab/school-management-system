import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';

import { EmailService } from '../email/email.service';

import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly emailService: EmailService,
  ) {}

  // ==========================================
  // LOGIN
  // ==========================================

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.usersService.findByEmail(loginDto.email);

    // User not found
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account status
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is deactivated');
    }

    // Get current token version
    const tokenVersion = user.tokenVersion ?? 0;

    // Create JWT payload
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion,
    };

    // Generate JWT
    const accessToken = this.jwtService.sign(payload);

    // ==========================================
    // PROFILE PICTURE URL
    // ==========================================

    let profilePicture: string | null = null;

    if (user.profilePicture) {
      profilePicture = `http://localhost:3000${user.profilePicture}`;
    }

    // ==========================================
    // USER FULL NAME
    // ==========================================

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // ==========================================
    // RETURN LOGIN RESPONSE
    // ==========================================

    return {
      message: 'Login successful',

      access_token: accessToken,

      user: {
        id: user._id,

        name: fullName,

        firstName: user.firstName,

        lastName: user.lastName,

        email: user.email,

        role: user.role,

        isActive: user.isActive,

        profilePicture,
      },
    };
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(userId: string) {
    return this.usersService.logout(userId);
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async changePassword(
    userId: string,

    currentPassword: string,

    newPassword: string,
  ) {
    return this.usersService.changePassword(
      userId,

      currentPassword,

      newPassword,
    );
  }

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  async forgotPassword(email: string) {
    // Find user by email
    const user = await this.usersService.findByEmail(email);

    // Do not reveal whether the email exists
    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset email has been sent.',
      };
    }

    // ==========================================
    // GENERATE SECURE RESET TOKEN
    // ==========================================

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires after 15 minutes
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // ==========================================
    // SAVE RESET TOKEN
    // ==========================================

    await this.usersService.setPasswordResetToken(
      user._id.toString(),

      resetToken,

      resetTokenExpires,
    );

    // ==========================================
    // SEND PASSWORD RESET EMAIL
    // ==========================================

    await this.emailService.sendPasswordResetEmail(
      user.email,

      resetToken,
    );

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return {
      message:
        'If an account with that email exists, a password reset email has been sent.',
    };
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  async resetPassword(
    token: string,

    newPassword: string,
  ) {
    // Find user using reset token
    const user = await this.usersService.findByPasswordResetToken(token);

    // Token invalid or expired
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    // and remove reset token
    await this.usersService.resetPassword(
      user._id.toString(),

      hashedPassword,
    );

    return {
      message: 'Password reset successfully',
    };
  }
}
