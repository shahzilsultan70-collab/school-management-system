import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user.schema';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly emailService: EmailService,
  ) {}

  // ==========================================
  // UPDATE PROFILE PICTURE
  // ==========================================

  async updateProfilePicture(userId: string, filename: string): Promise<any> {
    const profilePicture = `/uploads/profiles/${filename}`;

    const result = await this.userModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          profilePicture,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findById(userId)
      .select('-password -passwordResetToken -passwordResetExpires')
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Profile picture uploaded successfully',
      profilePicture,
      user,
    };
  }

  // ==========================================
  // CREATE USER
  // ADMIN ONLY
  // ==========================================

  async create(createUserDto: CreateUserDto): Promise<any> {
    const email = createUserDto.email.trim().toLowerCase();

    // ==========================================
    // CHECK IF EMAIL ALREADY EXISTS
    // ==========================================

    const existingUser = await this.userModel.findOne({
      email,
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // ==========================================
    // KEEP TEMPORARY PASSWORD FOR EMAIL
    // ==========================================

    const temporaryPassword = createUserDto.password;

    // ==========================================
    // HASH PASSWORD BEFORE SAVING
    // ==========================================

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = new this.userModel({
      firstName: createUserDto.firstName.trim(),

      lastName: createUserDto.lastName.trim(),

      email,

      password: hashedPassword,

      role: createUserDto.role,

      isActive:
        createUserDto.isActive !== undefined ? createUserDto.isActive : true,

      tokenVersion: 0,
    });

    // ==========================================
    // SAVE USER
    // ==========================================

    const savedUser = await user.save();

    // ==========================================
    // SEND WELCOME EMAIL
    // ==========================================

    await this.emailService.sendNewUserCredentialsEmail(
      savedUser.email,
      savedUser.firstName,
      savedUser.lastName,
      savedUser.role,
      temporaryPassword,
    );

    // ==========================================
    // REMOVE SENSITIVE INFORMATION
    // ==========================================

    // Use any here so TypeScript allows deleting
    // sensitive properties from the plain object.
    const safeUser: any = savedUser.toObject();

    delete safeUser.password;

    delete safeUser.passwordResetToken;

    delete safeUser.passwordResetExpires;

    // ==========================================
    // RETURN RESPONSE
    // ==========================================

    return {
      message: 'User created successfully and login credentials sent to email',

      user: safeUser,

      emailSent: true,
    };
  }

  // ==========================================
  // GET ALL USERS
  // ==========================================

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password -passwordResetToken -passwordResetExpires')
      .exec();
  }

  // ==========================================
  // GET USER BY ID
  // ==========================================

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-password -passwordResetToken -passwordResetExpires')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==========================================
  // FIND USER BY EMAIL
  // ==========================================

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
      })
      .exec();
  }

  // ==========================================
  // FIND USER BY ID
  // ==========================================

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  // ==========================================
  // UPDATE USER
  // ==========================================

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ==========================================
    // CHECK EMAIL UNIQUENESS
    // ==========================================

    if (updateUserDto.email) {
      const normalizedEmail = updateUserDto.email.trim().toLowerCase();

      if (normalizedEmail !== user.email) {
        const existingUser = await this.userModel.findOne({
          email: normalizedEmail,

          _id: {
            $ne: id,
          },
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }

        updateUserDto.email = normalizedEmail;
      }
    }

    // ==========================================
    // HASH NEW PASSWORD
    // ==========================================

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // ==========================================
    // TRIM NAMES
    // ==========================================

    if (updateUserDto.firstName) {
      updateUserDto.firstName = updateUserDto.firstName.trim();
    }

    if (updateUserDto.lastName) {
      updateUserDto.lastName = updateUserDto.lastName.trim();
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    Object.assign(user, updateUserDto);

    return user.save();
  }

  // ==========================================
  // DELETE USER
  // ==========================================

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }

  // ==========================================
  // ACTIVATE USER
  // ==========================================

  async activate(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isActive: true,
      },
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==========================================
  // DEACTIVATE USER
  // ==========================================

  async deactivate(id: string): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,

      $inc: {
        tokenVersion: 1,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  // ==========================================
  // SET PASSWORD RESET TOKEN
  // ==========================================

  async setPasswordResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpires: Date,
  ): Promise<void> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpires,
      },
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  // ==========================================
  // FIND USER BY RESET TOKEN
  // ==========================================

  async findByPasswordResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        passwordResetToken: token,

        passwordResetExpires: {
          $gt: new Date(),
        },
      })
      .exec();
  }

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,

        $unset: {
          passwordResetToken: '',
          passwordResetExpires: '',
        },

        $inc: {
          tokenVersion: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: {
        tokenVersion: 1,
      },
    });

    return {
      message: 'Logout successful',
    };
  }

  // ==========================================
  // REMOVE PROFILE PICTURE
  // ==========================================

  async removeProfilePicture(userId: string): Promise<{ message: string }> {
    const result = await this.userModel.updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          profilePicture: null,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Profile picture removed successfully',
    };
  }
}
