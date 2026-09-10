import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';

import { Fee, FeeDocument, PaymentStatus } from './schemas/fee.schema';

@Injectable()
export class FeesService {
  constructor(
    @InjectModel(Fee.name)
    private readonly feeModel: Model<FeeDocument>,
  ) {}

  async create(createFeeDto: CreateFeeDto) {
    const { studentId, totalAmount, paymentDate, ...otherData } = createFeeDto;

    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    if (totalAmount <= 0) {
      throw new BadRequestException('Total fee amount must be greater than 0');
    }

    const existingStudentFee = await this.feeModel.findOne({
      studentId: new Types.ObjectId(studentId),
      feeType: createFeeDto.feeType,
      academicSession: createFeeDto.academicSession,
      month: createFeeDto.month ?? null,
    });

    if (existingStudentFee) {
      throw new BadRequestException(
        'A fee record already exists for this student, fee type, academic session and month',
      );
    }

    const fee = new this.feeModel({
      studentId: new Types.ObjectId(studentId),
      ...otherData,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      status: PaymentStatus.PENDING,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
    });

    return fee.save();
  }

  async findAll() {
    return this.feeModel
      .find()
      .populate({
        path: 'studentId',
        select: 'name email role',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee ID');
    }

    const fee = await this.feeModel
      .findById(id)
      .populate({
        path: 'studentId',
        select: 'name email role',
      })
      .exec();

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    return fee;
  }

  async findByStudent(studentId: string) {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    return this.feeModel
      .find({
        studentId: new Types.ObjectId(studentId),
      })
      .populate({
        path: 'studentId',
        select: 'name email role',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateFeeDto: UpdateFeeDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee ID');
    }

    const fee = await this.feeModel.findById(id);

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    const totalAmount = updateFeeDto.totalAmount ?? fee.totalAmount;

    const paidAmount = updateFeeDto.paidAmount ?? fee.paidAmount;

    if (totalAmount <= 0) {
      throw new BadRequestException('Total fee amount must be greater than 0');
    }

    if (paidAmount < 0) {
      throw new BadRequestException('Paid amount cannot be negative');
    }

    if (paidAmount > totalAmount) {
      throw new BadRequestException(
        'Paid amount cannot be greater than total fee amount',
      );
    }

    const remainingAmount = totalAmount - paidAmount;

    let status: PaymentStatus;

    if (paidAmount === 0) {
      status = PaymentStatus.PENDING;
    } else if (paidAmount < totalAmount) {
      status = PaymentStatus.PARTIAL;
    } else {
      status = PaymentStatus.PAID;
    }

    fee.totalAmount = totalAmount;
    fee.paidAmount = paidAmount;
    fee.remainingAmount = remainingAmount;
    fee.status = status;

    if (updateFeeDto.feeType !== undefined) {
      fee.feeType = updateFeeDto.feeType;
    }

    if (updateFeeDto.academicSession !== undefined) {
      fee.academicSession = updateFeeDto.academicSession;
    }

    if (updateFeeDto.month !== undefined) {
      fee.month = updateFeeDto.month;
    }

    if (updateFeeDto.dueDate !== undefined) {
      fee.dueDate = new Date(updateFeeDto.dueDate);
    }

    if (updateFeeDto.paymentDate !== undefined) {
      fee.paymentDate = new Date(updateFeeDto.paymentDate);
    }

    if (updateFeeDto.paymentMethod !== undefined) {
      fee.paymentMethod = updateFeeDto.paymentMethod;
    }

    if (updateFeeDto.notes !== undefined) {
      fee.notes = updateFeeDto.notes;
    }

    return fee.save();
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid fee ID');
    }

    const fee = await this.feeModel.findByIdAndDelete(id);

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    return {
      message: 'Fee record deleted successfully',
    };
  }
}
