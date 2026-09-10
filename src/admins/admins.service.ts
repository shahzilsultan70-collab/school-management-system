import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Admin } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<Admin>,
  ) {}

  // Create Admin
  async create(createAdminDto: CreateAdminDto) {
    const { userId, ...adminData } = createAdminDto;

    // Check if userId is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const admin = new this.adminModel({
      userId: new Types.ObjectId(userId),
      ...adminData,
    });

    return admin.save();
  }

  // Get all Admins
  async findAll() {
    return this.adminModel.find().populate('userId').exec();
  }

  // Get one Admin
  async findOne(id: string) {
    const admin = await this.adminModel.findById(id).populate('userId').exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  // Update Admin
  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.adminModel
      .findByIdAndUpdate(id, updateAdminDto, {
        new: true,
        runValidators: true,
      })
      .populate('userId')
      .exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  // Delete Admin
  async remove(id: string) {
    const admin = await this.adminModel.findByIdAndDelete(id).exec();

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      message: 'Admin deleted successfully',
    };
  }
}
