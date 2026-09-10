import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { existsSync, unlinkSync } from 'fs';

import { join } from 'path';

import { Student } from './schemas/student.schema';

import {
  StudentDocument,
  StudentDocumentDocument,
  StudentDocumentType,
} from './schemas/student-document.schema';

import { CreateStudentDto } from './dto/create-student.dto';

import { UpdateStudentDto } from './dto/update-student.dto';

import { Counter } from './schemas/counter.schema';

import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<Student>,

    @InjectModel(StudentDocument.name)
    private readonly studentDocumentModel: Model<StudentDocumentDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Counter.name)
    private readonly counterModel: Model<Counter>,
  ) {}

  // ==========================================
  // GENERATE STUDENT ID
  // ==========================================

  private async generateStudentId(): Promise<string> {
    const currentYear = new Date().getFullYear();

    const counterKey = `student-${currentYear}`;

    const counter = await this.counterModel.findOneAndUpdate(
      {
        key: counterKey,
      },
      {
        $inc: {
          sequence: 1,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!counter) {
      throw new Error('Unable to generate student ID');
    }

    const sequenceNumber = counter.sequence.toString().padStart(4, '0');

    return `STU-${currentYear}-${sequenceNumber}`;
  }

  // ==========================================
  // CREATE STUDENT
  // USER + STUDENT
  // ==========================================

  async create(createStudentDto: CreateStudentDto) {
    const { user, rollNumber, className, section } = createStudentDto;

    // ==========================================
    // NORMALIZE USER DATA
    // ==========================================

    const firstName = user.firstName.trim();

    const lastName = user.lastName.trim();

    const email = user.email.trim().toLowerCase();

    // ==========================================
    // CHECK EMAIL
    // ==========================================

    const existingUser = await this.userModel.findOne({
      email,
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // ==========================================
    // GENERATE STUDENT ID
    // ==========================================

    const studentId = await this.generateStudentId();

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(user.password, 10);

    let savedUser: UserDocument | null = null;

    try {
      // ==========================================
      // CREATE USER
      // ROLE IS AUTOMATICALLY STUDENT
      // ==========================================

      const newUser = new this.userModel({
        firstName,

        lastName,

        email,

        password: hashedPassword,

        role: UserRole.STUDENT,

        isActive: true,

        tokenVersion: 0,

        profilePicture: user.profilePicture ?? null,
      });

      savedUser = await newUser.save();

      // ==========================================
      // CREATE STUDENT
      // ==========================================

      const student = new this.studentModel({
        userId: savedUser._id,

        studentId,

        rollNumber: rollNumber.trim(),

        className: className.trim(),

        section: section.trim(),

        isActive: true,
      });

      const savedStudent = await student.save();

      // ==========================================
      // RETURN COMPLETE DATA
      // ==========================================

      const safeUser: any = savedUser.toObject();

      delete safeUser.password;

      delete safeUser.passwordResetToken;

      delete safeUser.passwordResetExpires;

      return {
        message: 'Student created successfully',

        student: {
          ...savedStudent.toObject(),

          user: safeUser,
        },
      };
    } catch (error) {
      // ==========================================
      // ROLLBACK USER IF STUDENT CREATION FAILS
      // ==========================================

      if (savedUser) {
        await this.userModel.deleteOne({
          _id: savedUser._id,
        });
      }

      throw error;
    }
  }

  // ==========================================
  // GET ALL STUDENTS
  // ==========================================

  async findAll() {
    return this.studentModel
      .find()
      .populate({
        path: 'userId',
        select: '-password -passwordResetToken -passwordResetExpires',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // ==========================================
  // GET ONE STUDENT
  // ==========================================

  async findOne(id: string) {
    const student = await this.studentModel
      .findById(id)
      .populate({
        path: 'userId',
        select: '-password -passwordResetToken -passwordResetExpires',
      })
      .exec();

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  // ==========================================
  // UPDATE STUDENT + USER
  // ==========================================

  async update(id: string, updateData: UpdateStudentDto) {
    const student = await this.studentModel.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // ==========================================
    // GET LINKED USER
    // ==========================================

    const user = await this.userModel.findById(student.userId);

    if (!user) {
      throw new NotFoundException('Linked user account not found');
    }

    // ==========================================
    // UPDATE USER INFORMATION
    // ==========================================

    if (updateData.user) {
      const userData = updateData.user;

      // ==========================================
      // EMAIL
      // ==========================================

      if (userData.email) {
        const normalizedEmail = userData.email.trim().toLowerCase();

        if (normalizedEmail !== user.email) {
          const existingUser = await this.userModel.findOne({
            email: normalizedEmail,

            _id: {
              $ne: user._id,
            },
          });

          if (existingUser) {
            throw new ConflictException(
              'A user with this email already exists',
            );
          }

          user.email = normalizedEmail;
        }
      }

      // ==========================================
      // FIRST NAME
      // ==========================================

      if (userData.firstName) {
        user.firstName = userData.firstName.trim();
      }

      // ==========================================
      // LAST NAME
      // ==========================================

      if (userData.lastName) {
        user.lastName = userData.lastName.trim();
      }

      // ==========================================
      // PASSWORD
      // ==========================================

      if (userData.password) {
        user.password = await bcrypt.hash(userData.password, 10);

        user.tokenVersion += 1;
      }

      // ==========================================
      // PROFILE PICTURE
      // ==========================================

      if (userData.profilePicture !== undefined) {
        user.profilePicture = userData.profilePicture;
      }

      // ==========================================
      // ROLE MUST NEVER CHANGE
      // ==========================================

      user.role = UserRole.STUDENT;

      await user.save();
    }

    // ==========================================
    // UPDATE STUDENT INFORMATION
    // ==========================================

    if (updateData.rollNumber) {
      student.rollNumber = updateData.rollNumber.trim();
    }

    if (updateData.className) {
      student.className = updateData.className.trim();
    }

    if (updateData.section) {
      student.section = updateData.section.trim();
    }

    // ==========================================
    // STUDENT ID IS NEVER UPDATED
    // ==========================================

    await student.save();

    // ==========================================
    // RETURN COMPLETE STUDENT
    // ==========================================

    return this.findOne(id);
  }

  // ==========================================
  // DELETE STUDENT
  // ==========================================

  async remove(id: string) {
    const student = await this.studentModel.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // ==========================================
    // DELETE LINKED USER
    // ==========================================

    await this.userModel.deleteOne({
      _id: student.userId,
    });

    // ==========================================
    // DELETE STUDENT
    // ==========================================

    await this.studentModel.deleteOne({
      _id: id,
    });

    return {
      message: 'Student and linked user account deleted successfully',
    };
  }

  // ==========================================
  // ACTIVATE STUDENT
  // ==========================================

  async activate(id: string) {
    const student = await this.studentModel.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // ==========================================
    // ACTIVATE STUDENT
    // ==========================================

    student.isActive = true;

    await student.save();

    // ==========================================
    // ACTIVATE USER ACCOUNT
    // ==========================================

    await this.userModel.findByIdAndUpdate(student.userId, {
      isActive: true,
    });

    return {
      message: 'Student activated successfully',

      student: await this.findOne(id),
    };
  }

  // ==========================================
  // DEACTIVATE STUDENT
  // ==========================================

  async deactivate(id: string) {
    const student = await this.studentModel.findById(id);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // ==========================================
    // DEACTIVATE STUDENT
    // ==========================================

    student.isActive = false;

    await student.save();

    // ==========================================
    // DEACTIVATE USER ACCOUNT
    // ==========================================

    await this.userModel.findByIdAndUpdate(student.userId, {
      isActive: false,
    });

    return {
      message: 'Student deactivated successfully',

      student: await this.findOne(id),
    };
  }

  // ==========================================
  // CHECK STUDENT DOCUMENT ACCESS
  // ==========================================

  private async checkStudentDocumentAccess(studentId: string, user: any) {
    const student = await this.studentModel.findById(studentId).exec();

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // ==========================================
    // ADMIN
    // ==========================================

    if (user.role === UserRole.ADMIN) {
      return student;
    }

    // ==========================================
    // STUDENT
    // ==========================================

    if (user.role === UserRole.STUDENT) {
      if (student.userId.toString() !== user.userId) {
        throw new ForbiddenException(
          'You can only access your own student documents',
        );
      }

      return student;
    }

    throw new ForbiddenException(
      'You are not allowed to access student documents',
    );
  }

  // ==========================================
  // UPLOAD STUDENT DOCUMENT
  // ==========================================

  async uploadDocument(
    studentId: string,
    documentType: StudentDocumentType,
    file: Express.Multer.File,
    user: any,
  ) {
    await this.checkStudentDocumentAccess(studentId, user);

    const document = new this.studentDocumentModel({
      studentId,

      documentType,

      fileName: file.originalname,

      storedFileName: file.filename,

      filePath: `/uploads/students/documents/${file.filename}`,

      mimeType: file.mimetype,

      fileSize: file.size,
    });

    const savedDocument = await document.save();

    return {
      message: 'Student document uploaded successfully',

      document: savedDocument,
    };
  }

  // ==========================================
  // GET ALL STUDENT DOCUMENTS
  // ==========================================

  async findStudentDocuments(studentId: string, user: any) {
    await this.checkStudentDocumentAccess(studentId, user);

    return this.studentDocumentModel
      .find({
        studentId,
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  // ==========================================
  // GET ONE STUDENT DOCUMENT
  // ==========================================

  async findDocument(studentId: string, documentId: string, user: any) {
    await this.checkStudentDocumentAccess(studentId, user);

    const document = await this.studentDocumentModel.findOne({
      _id: documentId,
      studentId,
    });

    if (!document) {
      throw new NotFoundException('Student document not found');
    }

    return document;
  }

  // ==========================================
  // DELETE STUDENT DOCUMENT
  // ==========================================

  async deleteDocument(studentId: string, documentId: string, user: any) {
    await this.checkStudentDocumentAccess(studentId, user);

    const document = await this.studentDocumentModel.findOne({
      _id: documentId,
      studentId,
    });

    if (!document) {
      throw new NotFoundException('Student document not found');
    }

    // ==========================================
    // DELETE PHYSICAL FILE
    // ==========================================

    const physicalFilePath = join(
      process.cwd(),
      document.filePath.replace(/^\/+/, ''),
    );

    if (existsSync(physicalFilePath)) {
      unlinkSync(physicalFilePath);
    }

    // ==========================================
    // DELETE DATABASE RECORD
    // ==========================================

    await this.studentDocumentModel.deleteOne({
      _id: documentId,
      studentId,
    });

    return {
      message: 'Student document deleted successfully',
    };
  }
}
