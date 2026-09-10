import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';

import { UsersModule } from '../users/users.module';

import { EmailModule } from '../email/email.module';

import { StringValue } from 'ms';

@Module({
  imports: [
    ConfigModule,

    UsersModule,

    EmailModule,

    PassportModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'school_management_super_secret_key_2026',

        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '1d') as StringValue,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [AuthService],
})
export class AuthModule {}
