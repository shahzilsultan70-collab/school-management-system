import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Class } from './schemas/class.schema';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name)
    private classModel: Model<Class>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const existingClass = await this.classModel.findOne({
      className: createClassDto.className,
    });

    if (existingClass) {
      throw new ConflictException('Class already exists');
    }

    const newClass = new this.classModel(createClassDto);

    return newClass.save();
  }

  async findAll() {
    return this.classModel.find().exec();
  }

  async findOne(id: string) {
    const classData = await this.classModel.findById(id).exec();

    if (!classData) {
      throw new NotFoundException('Class not found');
    }

    return classData;
  }
}
