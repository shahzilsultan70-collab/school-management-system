import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Leave, LeaveDocument, LeaveStatus } from './schemas/leave.schema';

import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

import { Student } from '../students/schemas/student.schema';

import { Teacher } from '../teachers/schemas/teacher.schema';

import { CreateLeaveDto } from './dto/create-leave.dto';

import { RejectLeaveDto } from './dto/reject-leave.dto';

import { EmailService } from '../email/email.service';

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(Leave.name)
    private readonly leaveModel: Model<LeaveDocument>,

    @InjectModel(Student.name)
    private readonly studentModel: Model<Student>,

    @InjectModel(Teacher.name)
    private readonly teacherModel: Model<Teacher>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly emailService: EmailService,
  ) {}

  // ============================================================
  // CREATE LEAVE
  // ============================================================

  async create(createLeaveDto: CreateLeaveDto, user: any) {
    if (user.role !== UserRole.STUDENT && user.role !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only students and teachers can submit leave requests',
      );
    }

    const userId = user.userId || user.sub || user.id;

    if (!userId) {
      throw new BadRequestException(
        'User ID was not found in authentication token',
      );
    }

    const currentUser = await this.userModel.findById(userId);

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (!currentUser.isActive) {
      throw new ForbiddenException('Your account is deactivated');
    }

    const startDate = new Date(createLeaveDto.startDate);

    const endDate = new Date(createLeaveDto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start date or end date');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    const overlappingLeave = await this.leaveModel.findOne({
      userId: new Types.ObjectId(userId),

      status: {
        $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
      },

      startDate: {
        $lte: endDate,
      },

      endDate: {
        $gte: startDate,
      },
    });

    if (overlappingLeave) {
      throw new BadRequestException(
        'You already have a pending or approved leave request for these dates',
      );
    }

    let studentId: Types.ObjectId | null = null;

    let teacherId: Types.ObjectId | null = null;

    if (user.role === UserRole.STUDENT) {
      const student = await this.studentModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      studentId = student._id as Types.ObjectId;
    }

    if (user.role === UserRole.TEACHER) {
      const teacher = await this.teacherModel.findOne({
        userId: new Types.ObjectId(userId),
      });

      if (!teacher) {
        throw new NotFoundException('Teacher profile not found');
      }

      teacherId = teacher._id as Types.ObjectId;
    }

    const leave = await this.leaveModel.create({
      userId: new Types.ObjectId(userId),

      studentId,

      teacherId,

      leaveType: createLeaveDto.leaveType,

      startDate,

      endDate,

      reason: createLeaveDto.reason,

      status: LeaveStatus.PENDING,

      rejectionReason: null,

      reviewedBy: null,

      reviewedAt: null,
    });

    return {
      message: 'Leave request submitted successfully',

      leave,
    };
  }

  // ============================================================
  // FIND MY LEAVES
  // ============================================================

  async findMyLeaves(user: any) {
    const userId = user.userId || user.sub || user.id;

    if (!userId) {
      throw new BadRequestException(
        'User ID was not found in authentication token',
      );
    }

    const leaves = await this.leaveModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .populate('userId', 'name firstName lastName email role')
      .populate('studentId', 'studentId rollNumber className section')
      .populate('reviewedBy', 'name firstName lastName email role')
      .sort({
        createdAt: -1,
      });

    return {
      message: 'My leave requests retrieved successfully',

      count: leaves.length,

      leaves,
    };
  }

  // ============================================================
  // FIND ALL LEAVES
  // ============================================================

  async findAll(user: any) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can view all leave requests',
      );
    }

    const leaves = await this.leaveModel
      .find()
      .populate('userId', 'name firstName lastName email role isActive')
      .populate('studentId', 'studentId rollNumber className section')
      .populate('reviewedBy', 'name firstName lastName email role')
      .sort({
        createdAt: -1,
      });

    return {
      message: 'All leave requests retrieved successfully',

      count: leaves.length,

      leaves,
    };
  }

  // ============================================================
  // FIND ONE LEAVE
  // ============================================================

  async findOne(id: string, user: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    const leave = await this.leaveModel
      .findById(id)
      .populate('userId', 'name firstName lastName email role isActive')
      .populate('studentId', 'studentId rollNumber className section')
      .populate('reviewedBy', 'name firstName lastName email role');

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (user.role !== UserRole.ADMIN) {
      const userId = user.userId || user.sub || user.id;

      if (leave.userId._id.toString() !== userId.toString()) {
        throw new ForbiddenException(
          'You can only view your own leave requests',
        );
      }
    }

    return {
      message: 'Leave request retrieved successfully',

      leave,
    };
  }

  // ============================================================
  // APPROVE LEAVE
  // ============================================================

  async approve(id: string, user: any) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can approve leave requests',
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    const leave = await this.leaveModel
      .findById(id)
      .populate('userId', 'name firstName lastName email role isActive');

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request has already been ${leave.status}`,
      );
    }

    const leaveUser: any = leave.userId;

    if (!leaveUser) {
      throw new NotFoundException('Leave request user not found');
    }

    if (!leaveUser.isActive) {
      throw new ForbiddenException(
        'The user who submitted this leave request is inactive',
      );
    }

    const recipientName =
      leaveUser.firstName && leaveUser.lastName
        ? `${leaveUser.firstName} ${leaveUser.lastName}`
        : leaveUser.name || leaveUser.email;

    let studentDetails: any = {};

    let teacherDetails: any = {};

    if (leaveUser.role === UserRole.STUDENT && leave.studentId) {
      const student = await this.studentModel
        .findById(leave.studentId)
        .select('studentId rollNumber className section')
        .lean();

      if (student) {
        studentDetails = {
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          className: student.className,
          section: student.section,
        };
      }
    }

    if (leaveUser.role === UserRole.TEACHER) {
      const teacher = await this.teacherModel
        .findOne({
          userId: leaveUser._id,
        })
        .select('employeeId qualification phone')
        .lean();

      if (teacher) {
        teacherDetails = {
          employeeId: teacher.employeeId,
          qualification: teacher.qualification,
          phone: teacher.phone,
        };
      }
    }

    leave.status = LeaveStatus.APPROVED;

    leave.rejectionReason = null;

    leave.reviewedBy = new Types.ObjectId(user.userId || user.sub || user.id);

    leave.reviewedAt = new Date();

    const updatedLeave = await leave.save();

    await this.emailService.sendLeaveApprovedEmail(
      leaveUser.email,

      recipientName,

      leaveUser.role,

      leave.leaveType,

      leave.startDate,

      leave.endDate,

      leave.reason,

      {
        ...studentDetails,
        ...teacherDetails,
      },
    );

    return {
      message: 'Leave request approved successfully',

      leave: updatedLeave,
    };
  }

  // ============================================================
  // REJECT LEAVE
  // ============================================================

  async reject(id: string, rejectLeaveDto: RejectLeaveDto, user: any) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can reject leave requests',
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    const leave = await this.leaveModel
      .findById(id)
      .populate('userId', 'name firstName lastName email role isActive');

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request has already been ${leave.status}`,
      );
    }

    const leaveUser: any = leave.userId;

    if (!leaveUser) {
      throw new NotFoundException('Leave request user not found');
    }

    if (!leaveUser.isActive) {
      throw new ForbiddenException(
        'The user who submitted this leave request is inactive',
      );
    }

    const recipientName =
      leaveUser.firstName && leaveUser.lastName
        ? `${leaveUser.firstName} ${leaveUser.lastName}`
        : leaveUser.name || leaveUser.email;

    let studentDetails: any = {};

    let teacherDetails: any = {};

    // ------------------------------------------------------------
    // GET STUDENT DETAILS
    // ------------------------------------------------------------

    if (leaveUser.role === UserRole.STUDENT && leave.studentId) {
      const student = await this.studentModel
        .findById(leave.studentId)
        .select('studentId rollNumber className section')
        .lean();

      if (student) {
        studentDetails = {
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          className: student.className,
          section: student.section,
        };
      }
    }

    // ------------------------------------------------------------
    // GET TEACHER DETAILS
    // ------------------------------------------------------------

    if (leaveUser.role === UserRole.TEACHER) {
      const teacher = await this.teacherModel
        .findOne({
          userId: leaveUser._id,
        })
        .select('employeeId qualification phone')
        .lean();

      if (teacher) {
        teacherDetails = {
          employeeId: teacher.employeeId,
          qualification: teacher.qualification,
          phone: teacher.phone,
        };
      }
    }

    // ------------------------------------------------------------
    // UPDATE LEAVE STATUS
    // ------------------------------------------------------------

    leave.status = LeaveStatus.REJECTED;

    leave.rejectionReason = rejectLeaveDto.rejectionReason;

    leave.reviewedBy = new Types.ObjectId(user.userId || user.sub || user.id);

    leave.reviewedAt = new Date();

    const updatedLeave = await leave.save();

    // ------------------------------------------------------------
    // SEND REJECTION EMAIL
    // ------------------------------------------------------------

    await this.emailService.sendLeaveRejectedEmail(
      leaveUser.email,

      recipientName,

      leaveUser.role,

      leave.leaveType,

      leave.startDate,

      leave.endDate,

      leave.reason,

      rejectLeaveDto.rejectionReason,

      {
        ...studentDetails,
        ...teacherDetails,
      },
    );

    return {
      message: 'Leave request rejected successfully',

      leave: updatedLeave,
    };
  }

  // ============================================================
  // DELETE / CANCEL LEAVE
  // ============================================================

  async remove(id: string, user: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    const leave = await this.leaveModel.findById(id);

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    const userId = user.userId || user.sub || user.id;

    // ------------------------------------------------------------
    // ADMIN CAN DELETE ANY LEAVE
    // ------------------------------------------------------------

    if (user.role === UserRole.ADMIN) {
      await this.leaveModel.findByIdAndDelete(id);

      return {
        message: 'Leave request deleted successfully',
      };
    }

    // ------------------------------------------------------------
    // STUDENT / TEACHER CAN ONLY CANCEL THEIR OWN
    // PENDING LEAVE
    // ------------------------------------------------------------

    if (leave.userId.toString() !== userId.toString()) {
      throw new ForbiddenException(
        'You can only cancel your own leave requests',
      );
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be cancelled',
      );
    }

    await this.leaveModel.findByIdAndDelete(id);

    return {
      message: 'Leave request cancelled successfully',
    };
  }
}
