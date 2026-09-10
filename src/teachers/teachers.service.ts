import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Teacher } from './schemas/teacher.schema';
import { CreateTeacherDto } from './dto/create-teacher.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectModel(Teacher.name)
    private teacherModel: Model<Teacher>,
  ) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const teacher = new this.teacherModel(createTeacherDto);

    return teacher.save();
  }

  async findAll() {
    return this.teacherModel.find().populate('userId').exec();
  }

  async findOne(id: string) {
    const teacher = await this.teacherModel
      .findById(id)
      .populate('userId')
      .exec();

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(id: string, updateData: Partial<CreateTeacherDto>) {
    const teacher = await this.teacherModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async remove(id: string) {
    const teacher = await this.teacherModel.findByIdAndDelete(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      message: 'Teacher deleted successfully',
    };
  }

  async activate(id: string) {
    const teacher = await this.teacherModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    );

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      message: 'Teacher activated successfully',
      teacher,
    };
  }

  async deactivate(id: string) {
    const teacher = await this.teacherModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      message: 'Teacher deactivated successfully',
      teacher,
    };
  }
}
