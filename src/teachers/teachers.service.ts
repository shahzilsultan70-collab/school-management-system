import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { Teacher } from './schemas/teacher.schema';
import { CreateTeacherDto } from './dto/create-teacher.dto';

import { User, UserRole } from '../users/schemas/user.schema';

import { Counter } from '../students/schemas/counter.schema';

@Injectable()
export class TeachersService {
  constructor(
    @InjectModel(Teacher.name)
    private teacherModel: Model<Teacher>,

    @InjectModel(User.name)
    private userModel: Model<User>,

    @InjectModel(Counter.name)
    private counterModel: Model<Counter>,
  ) {}

  // =========================================================
  // Generate Employee ID
  // =========================================================

  private async generateEmployeeId(): Promise<string> {
    const currentYear = new Date().getFullYear();

    const counter = await this.counterModel.findOneAndUpdate(
      {
        key: `teacher-${currentYear}`,
      },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    const sequence = counter.sequence.toString().padStart(4, '0');

    return `EMP-${currentYear}-${sequence}`;
  }

  // =========================================================
  // Create Teacher
  // =========================================================

  async create(createTeacherDto: CreateTeacherDto) {
    const { firstName, lastName, email, password, qualification, phone } =
      createTeacherDto;

    const normalizedEmail = email.trim().toLowerCase();

    // -------------------------------------------------------
    // Check duplicate email
    // -------------------------------------------------------

    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // -------------------------------------------------------
    // Hash password
    // -------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // -------------------------------------------------------
    // Generate Employee ID
    // -------------------------------------------------------

    const employeeId = await this.generateEmployeeId();

    // -------------------------------------------------------
    // Create User
    // -------------------------------------------------------

    const user = await this.userModel.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.TEACHER,
      isActive: true,
      tokenVersion: 0,
      profilePicture: null,
    });

    try {
      // -----------------------------------------------------
      // Create Teacher
      // -----------------------------------------------------

      const teacher = await this.teacherModel.create({
        userId: user._id,
        employeeId,
        qualification: qualification.trim(),
        phone: phone.trim(),
        isActive: true,
      });

      // -----------------------------------------------------
      // Return safe response
      // -----------------------------------------------------

      return {
        message: 'Teacher created successfully',

        teacher: {
          _id: teacher._id,
          employeeId: teacher.employeeId,
          qualification: teacher.qualification,
          phone: teacher.phone,
          isActive: teacher.isActive,

          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            profilePicture: user.profilePicture,
          },
        },
      };
    } catch (error) {
      // -----------------------------------------------------
      // Rollback User if Teacher creation fails
      // -----------------------------------------------------

      await this.userModel.findByIdAndDelete(user._id);

      throw error;
    }
  }

  // =========================================================
  // Get All Teachers
  // =========================================================

  async findAll() {
    return this.teacherModel
      .find()
      .populate({
        path: 'userId',
        select:
          'firstName lastName email role isActive profilePicture createdAt updatedAt',
      })
      .exec();
  }

  // =========================================================
  // Get One Teacher
  // =========================================================

  async findOne(id: string) {
    const teacher = await this.teacherModel
      .findById(id)
      .populate({
        path: 'userId',
        select:
          'firstName lastName email role isActive profilePicture createdAt updatedAt',
      })
      .exec();

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  // =========================================================
  // Update Teacher
  // =========================================================

  async update(id: string, updateData: Partial<CreateTeacherDto>) {
    const teacher = await this.teacherModel.findById(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const user = await this.userModel.findById(teacher.userId);

    if (!user) {
      throw new NotFoundException('Teacher user account not found');
    }

    // -------------------------------------------------------
    // Update User Information
    // -------------------------------------------------------

    if (updateData.firstName !== undefined) {
      user.firstName = updateData.firstName.trim();
    }

    if (updateData.lastName !== undefined) {
      user.lastName = updateData.lastName.trim();
    }

    if (updateData.email !== undefined) {
      const normalizedEmail = updateData.email.trim().toLowerCase();

      const existingUser = await this.userModel.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }

      user.email = normalizedEmail;
    }

    if (updateData.password !== undefined) {
      user.password = await bcrypt.hash(updateData.password, 10);
    }

    await user.save();

    // -------------------------------------------------------
    // Update Teacher Information
    // -------------------------------------------------------

    if (updateData.qualification !== undefined) {
      teacher.qualification = updateData.qualification.trim();
    }

    if (updateData.phone !== undefined) {
      teacher.phone = updateData.phone.trim();
    }

    await teacher.save();

    // -------------------------------------------------------
    // Return Updated Teacher
    // -------------------------------------------------------

    return this.findOne(id);
  }

  // =========================================================
  // Delete Teacher
  // =========================================================

  async remove(id: string) {
    const teacher = await this.teacherModel.findById(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Delete teacher record
    await this.teacherModel.findByIdAndDelete(id);

    // Delete linked user account
    await this.userModel.findByIdAndDelete(teacher.userId);

    return {
      message: 'Teacher deleted successfully',
    };
  }

  // =========================================================
  // Activate Teacher
  // =========================================================

  async activate(id: string) {
    const teacher = await this.teacherModel.findById(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    teacher.isActive = true;
    await teacher.save();

    await this.userModel.findByIdAndUpdate(teacher.userId, {
      isActive: true,
    });

    return {
      message: 'Teacher activated successfully',
      teacher: await this.findOne(id),
    };
  }

  // =========================================================
  // Deactivate Teacher
  // =========================================================

  async deactivate(id: string) {
    const teacher = await this.teacherModel.findById(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    teacher.isActive = false;
    await teacher.save();

    await this.userModel.findByIdAndUpdate(teacher.userId, {
      isActive: false,
    });

    return {
      message: 'Teacher deactivated successfully',
      teacher: await this.findOne(id),
    };
  }
}
