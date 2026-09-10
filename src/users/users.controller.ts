import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname, join } from 'path';

import { existsSync, mkdirSync } from 'fs';

import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from './schemas/user.schema';

// ==========================================
// CREATE PROFILE PICTURE UPLOAD DIRECTORY
// ==========================================

const uploadPath = join(process.cwd(), 'uploads', 'profiles');

if (!existsSync(uploadPath)) {
  mkdirSync(uploadPath, {
    recursive: true,
  });
}

// ==========================================
// USERS CONTROLLER
// ==========================================

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ==========================================
  // CREATE USER
  // ADMIN ONLY
  // ==========================================

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ==========================================
  // GET ALL USERS
  // ADMIN ONLY
  // ==========================================

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // ==========================================
  // GET ONE USER
  // ADMIN ONLY
  // ==========================================

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ==========================================
  // UPDATE USER
  // ADMIN ONLY
  // ==========================================

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // ==========================================
  // DELETE USER
  // ADMIN ONLY
  // ==========================================

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ==========================================
  // ACTIVATE USER
  // ADMIN ONLY
  // ==========================================

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // ==========================================
  // DEACTIVATE USER
  // ADMIN ONLY
  // ==========================================

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  // ==========================================
  // UPLOAD / UPDATE PROFILE PICTURE
  // ==========================================

  @Post(':id/profile-picture')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,

        filename: (req, file, callback) => {
          const extension = extname(file.originalname).toLowerCase();

          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}${extension}`;

          callback(null, uniqueName);
        },
      }),

      // ========================================
      // FILE FILTER
      // ========================================

      fileFilter: (req, file, callback) => {
        console.log('====================================');
        console.log('Uploaded file:', file.originalname);
        console.log('MIME type:', file.mimetype);
        console.log('====================================');

        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/octet-stream',
        ];

        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        const extension = extname(file.originalname).toLowerCase();

        const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);

        const isExtensionAllowed = allowedExtensions.includes(extension);

        if (isMimeTypeAllowed && isExtensionAllowed) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              'Only JPG, JPEG, PNG, and WEBP image files are allowed',
            ),
            false,
          );
        }
      },

      // ========================================
      // FILE SIZE LIMIT
      // ========================================

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadProfilePicture(
    @Param('id') id: string,
    @UploadedFile()
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    // ========================================
    // CHECK AUTHENTICATED USER
    // ========================================

    if (!req.user) {
      throw new BadRequestException('Authenticated user information not found');
    }

    // ========================================
    // GET JWT USER INFORMATION
    // ========================================

    const loggedInUserId = req.user.sub?.toString();

    const loggedInUserRole = req.user.role;

    // ========================================
    // DEBUG INFORMATION
    // ========================================

    console.log('====================================');
    console.log('PROFILE PICTURE AUTHORIZATION');
    console.log('URL USER ID:', id);
    console.log('JWT USER ID:', loggedInUserId);
    console.log('JWT ROLE:', loggedInUserRole);
    console.log('====================================');

    // ========================================
    // CHECK ADMIN
    // ========================================

    const isAdmin = loggedInUserRole === UserRole.ADMIN;

    // ========================================
    // USER ID VALIDATION
    // ========================================

    if (!loggedInUserId) {
      throw new BadRequestException(
        'User ID was not found in authentication token',
      );
    }

    // ========================================
    // AUTHORIZATION
    // ========================================
    //
    // Admin can upload for any user.
    //
    // Teacher can upload only their own.
    //
    // Student can upload only their own.
    //

    if (!isAdmin && loggedInUserId !== id) {
      throw new BadRequestException(
        'You can only update your own profile picture',
      );
    }

    // ========================================
    // CHECK FILE
    // ========================================

    if (!file) {
      throw new BadRequestException('Please upload an image file');
    }

    // ========================================
    // SAVE PROFILE PICTURE
    // ========================================

    return this.usersService.updateProfilePicture(id, file.filename);
  }

  // ==========================================
  // DELETE PROFILE PICTURE
  // ==========================================

  @Delete(':id/profile-picture')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  async removeProfilePicture(@Param('id') id: string, @Request() req: any) {
    // ========================================
    // CHECK AUTHENTICATED USER
    // ========================================

    if (!req.user) {
      throw new BadRequestException('Authenticated user information not found');
    }

    // ========================================
    // GET JWT USER INFORMATION
    // ========================================

    const loggedInUserId = req.user.sub?.toString();

    const loggedInUserRole = req.user.role;

    // ========================================
    // CHECK ADMIN
    // ========================================

    const isAdmin = loggedInUserRole === UserRole.ADMIN;

    // ========================================
    // AUTHORIZATION
    // ========================================

    if (!isAdmin && loggedInUserId !== id) {
      throw new BadRequestException(
        'You can only delete your own profile picture',
      );
    }

    // ========================================
    // DELETE PROFILE PICTURE
    // ========================================

    return this.usersService.removeProfilePicture(id);
  }
}
