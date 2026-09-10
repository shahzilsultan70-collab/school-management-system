import {
  Body,
  Controller,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================
  // LOGIN
  // ==========================================

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body()
    changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    return this.authService.logout(req.user.userId);
  }

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  @Post('forgot-password')
  async forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  @Post('reset-password')
  async resetPassword(
    @Body()
    resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
