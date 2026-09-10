import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAILTRAP_HOST'),
      port: Number(this.configService.get<string>('MAILTRAP_PORT') || 2525),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAILTRAP_USER'),
        pass: this.configService.get<string>('MAILTRAP_PASS'),
      },
    });
  }

  // ============================================================
  // TEST EMAIL
  // ============================================================

  async sendTestEmail(to: string) {
    try {
      const info = await this.transporter.sendMail({
        from: {
          name:
            this.configService.get<string>('MAIL_FROM_NAME') ||
            'School Management System',
          address:
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
            'no-reply@schoolmanagement.com',
        },

        to,

        subject: 'Test Email - School Management System',

        text: `
School Management System

This is a test email.

Your email service is working correctly.
        `,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">

            <h2>School Management System</h2>

            <p>This is a test email.</p>

            <p>
              Your email service is working correctly.
            </p>

          </div>
        `,
      });

      return {
        message: 'Test email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Test email error:', error);

      throw new InternalServerErrorException('Failed to send test email');
    }
  }

  // ============================================================
  // PASSWORD RESET EMAIL
  // ============================================================

  async sendPasswordResetEmail(to: string, resetToken: string) {
    try {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      const info = await this.transporter.sendMail({
        from: {
          name:
            this.configService.get<string>('MAIL_FROM_NAME') ||
            'School Management System',
          address:
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
            'no-reply@schoolmanagement.com',
        },

        to,

        subject: 'Password Reset Request - School Management System',

        text: `
School Management System

You requested to reset your password.

Please use the following link to reset your password:

${resetUrl}

This link will expire after the configured reset period.

If you did not request a password reset, you can safely ignore this email.
        `,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: auto;
            "
          >

            <h2>School Management System</h2>

            <p>
              You requested to reset your password.
            </p>

            <p>
              Please click the button below to reset your password:
            </p>

            <p>
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  padding: 12px 20px;
                  background-color: #2563eb;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              This link will expire after the configured reset period.
            </p>

            <p>
              If you did not request a password reset,
              you can safely ignore this email.
            </p>

          </div>
        `,
      });

      return {
        message: 'Password reset email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Password reset email error:', error);

      throw new InternalServerErrorException(
        'Failed to send password reset email',
      );
    }
  }

  // ============================================================
  // LEAVE APPROVED EMAIL
  // ============================================================

  async sendLeaveApprovedEmail(
    to: string,
    name: string,
    role: string,
    leaveType: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    details: {
      studentId?: string;
      rollNumber?: string;
      className?: string;
      section?: string;
      employeeId?: string;
      qualification?: string;
      phone?: string;
    } = {},
  ) {
    try {
      const formattedStartDate = new Date(startDate).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const formattedLeaveType =
        leaveType.charAt(0).toUpperCase() + leaveType.slice(1);

      const isStudent = role === 'student';

      let detailsHtml = '';
      let detailsText = '';

      if (isStudent) {
        detailsHtml = `
          <h3>Student Details</h3>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            "
          >

            ${
              details.studentId
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Student ID
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.studentId}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.rollNumber
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Roll Number
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.rollNumber}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.className
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Grade
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.className}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.section
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Section
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.section}
                    </td>
                  </tr>
                `
                : ''
            }

          </table>
        `;

        detailsText = `
Student Details

Student ID: ${details.studentId || 'N/A'}
Roll Number: ${details.rollNumber || 'N/A'}
Grade: ${details.className || 'N/A'}
Section: ${details.section || 'N/A'}
        `;
      } else {
        detailsHtml = `
          <h3>Teacher Details</h3>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            "
          >

            ${
              details.employeeId
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Employee ID
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.employeeId}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.qualification
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Qualification
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.qualification}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.phone
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Phone
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.phone}
                    </td>
                  </tr>
                `
                : ''
            }

          </table>
        `;

        detailsText = `
Teacher Details

Employee ID: ${details.employeeId || 'N/A'}
Qualification: ${details.qualification || 'N/A'}
Phone: ${details.phone || 'N/A'}
        `;
      }

      const info = await this.transporter.sendMail({
        from: {
          name:
            this.configService.get<string>('MAIL_FROM_NAME') ||
            'School Management System',
          address:
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
            'no-reply@schoolmanagement.com',
        },

        to,

        subject: 'Leave Request Approved - School Management System',

        text: `
School Management System

Hello ${name},

Good news! Your leave request has been approved by the administration.

${detailsText}

Leave Details

Leave Type: ${formattedLeaveType}
Start Date: ${formattedStartDate}
End Date: ${formattedEndDate}
Reason: ${reason}
Status: APPROVED

Please make sure to return to school/work according to the approved leave dates.

Regards,
School Management System
        `,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: auto;
            "
          >

            <h2>School Management System</h2>

            <p>
              Hello <strong>${name}</strong>,
            </p>

            <p>
              Good news! Your leave request has been
              <strong>approved</strong> by the administration.
            </p>

            ${detailsHtml}

            <h3>Leave Details</h3>

            <table
              style="
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 20px;
              "
            >

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Leave Type
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedLeaveType}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Start Date
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedStartDate}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  End Date
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedEndDate}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Reason
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${reason}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Status
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  APPROVED
                </td>
              </tr>

            </table>

            <p>
              Please make sure to return to school/work according
              to the approved leave dates.
            </p>

            <p>
              Regards,<br />
              <strong>School Management System</strong>
            </p>

          </div>
        `,
      });

      return {
        message: 'Leave approval email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Leave approval email error:', error);

      throw new InternalServerErrorException(
        'Failed to send leave approval email',
      );
    }
  }

  // ============================================================
  // LEAVE REJECTED EMAIL
  // ============================================================

  async sendLeaveRejectedEmail(
    to: string,
    name: string,
    role: string,
    leaveType: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    rejectionReason: string,
    details: {
      studentId?: string;
      rollNumber?: string;
      className?: string;
      section?: string;
      employeeId?: string;
      qualification?: string;
      phone?: string;
    } = {},
  ) {
    try {
      const formattedStartDate = new Date(startDate).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

      const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const formattedLeaveType =
        leaveType.charAt(0).toUpperCase() + leaveType.slice(1);

      const isStudent = role === 'student';

      let detailsHtml = '';
      let detailsText = '';

      if (isStudent) {
        detailsHtml = `
          <h3>Student Details</h3>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            "
          >

            ${
              details.studentId
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Student ID
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.studentId}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.rollNumber
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Roll Number
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.rollNumber}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.className
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Grade
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.className}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.section
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Section
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.section}
                    </td>
                  </tr>
                `
                : ''
            }

          </table>
        `;

        detailsText = `
Student Details

Student ID: ${details.studentId || 'N/A'}
Roll Number: ${details.rollNumber || 'N/A'}
Grade: ${details.className || 'N/A'}
Section: ${details.section || 'N/A'}
        `;
      } else {
        detailsHtml = `
          <h3>Teacher Details</h3>

          <table
            style="
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 20px;
            "
          >

            ${
              details.employeeId
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Employee ID
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.employeeId}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.qualification
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Qualification
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.qualification}
                    </td>
                  </tr>
                `
                : ''
            }

            ${
              details.phone
                ? `
                  <tr>
                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                        font-weight: bold;
                      "
                    >
                      Phone
                    </td>

                    <td
                      style="
                        border: 1px solid #ddd;
                        padding: 8px;
                      "
                    >
                      ${details.phone}
                    </td>
                  </tr>
                `
                : ''
            }

          </table>
        `;

        detailsText = `
Teacher Details

Employee ID: ${details.employeeId || 'N/A'}
Qualification: ${details.qualification || 'N/A'}
Phone: ${details.phone || 'N/A'}
        `;
      }

      const info = await this.transporter.sendMail({
        from: {
          name:
            this.configService.get<string>('MAIL_FROM_NAME') ||
            'School Management System',
          address:
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
            'no-reply@schoolmanagement.com',
        },

        to,

        subject: 'Leave Request Rejected - School Management System',

        text: `
School Management System

Hello ${name},

Unfortunately, your leave request has been rejected by the administration.

${detailsText}

Leave Details

Leave Type: ${formattedLeaveType}
Start Date: ${formattedStartDate}
End Date: ${formattedEndDate}
Reason: ${reason}
Status: REJECTED

Rejection Reason:
${rejectionReason}

Please contact the school administration if you require further information.

Regards,
School Management System
        `,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: auto;
            "
          >

            <h2>School Management System</h2>

            <p>
              Hello <strong>${name}</strong>,
            </p>

            <p>
              Unfortunately, your leave request has been
              <strong>rejected</strong> by the administration.
            </p>

            ${detailsHtml}

            <h3>Leave Details</h3>

            <table
              style="
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 20px;
              "
            >

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Leave Type
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedLeaveType}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Start Date
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedStartDate}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  End Date
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${formattedEndDate}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Reason
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                  "
                >
                  ${reason}
                </td>
              </tr>

              <tr>
                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  Status
                </td>

                <td
                  style="
                    border: 1px solid #ddd;
                    padding: 8px;
                    font-weight: bold;
                  "
                >
                  REJECTED
                </td>
              </tr>

            </table>

            <div
              style="
                background-color: #f8f8f8;
                border-left: 4px solid #dc2626;
                padding: 12px 16px;
                margin-bottom: 20px;
              "
            >

              <h3 style="margin-top: 0;">
                Rejection Reason
              </h3>

              <p style="margin-bottom: 0;">
                ${rejectionReason}
              </p>

            </div>

            <p>
              Please contact the school administration if you
              require further information.
            </p>

            <p>
              Regards,<br />
              <strong>School Management System</strong>
            </p>

          </div>
        `,
      });

      return {
        message: 'Leave rejection email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Leave rejection email error:', error);

      throw new InternalServerErrorException(
        'Failed to send leave rejection email',
      );
    }
  }

  // ============================================================
  // NEW USER WELCOME + LOGIN CREDENTIALS EMAIL
  // ============================================================

  async sendNewUserCredentialsEmail(
    to: string,
    firstName: string,
    lastName: string,
    role: string,
    temporaryPassword: string,
  ) {
    try {
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';

      const fullName = `${firstName} ${lastName}`.trim();

      const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

      const info = await this.transporter.sendMail({
        from: {
          name:
            this.configService.get<string>('MAIL_FROM_NAME') ||
            'School Management System',

          address:
            this.configService.get<string>('MAIL_FROM_ADDRESS') ||
            'no-reply@schoolmanagement.com',
        },

        to,

        subject: 'Welcome to School Management System - Your Account Details',

        text: `
School Management System

Welcome ${fullName}!

Your account has been successfully created by the school administration.

You can now use the following credentials to log in to the School Management System.

Account Details

Name: ${fullName}
Email: ${to}
Role: ${formattedRole}
Temporary Password: ${temporaryPassword}

Login URL:
${frontendUrl}/login

Important Security Notice

This password is a temporary password provided by the school administration.

For your security, please log in and change your password as soon as possible.

If you did not expect this account to be created, please contact the school administration.

Regards,
School Management System
        `,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: auto;
            "
          >

            <div
              style="
                background-color: #2563eb;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 6px 6px 0 0;
              "
            >

              <h2 style="margin: 0;">
                School Management System
              </h2>

            </div>

            <div
              style="
                border: 1px solid #ddd;
                border-top: none;
                padding: 25px;
                border-radius: 0 0 6px 6px;
              "
            >

              <h2>
                Welcome ${fullName}!
              </h2>

              <p>
                Your account has been successfully created by
                the school administration.
              </p>

              <p>
                You can now use the following credentials to log in
                to the School Management System.
              </p>

              <h3>
                Account Details
              </h3>

              <table
                style="
                  border-collapse: collapse;
                  width: 100%;
                  margin-bottom: 25px;
                "
              >

                <tr>
                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                      font-weight: bold;
                      width: 35%;
                    "
                  >
                    Name
                  </td>

                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                    "
                  >
                    ${fullName}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                      font-weight: bold;
                    "
                  >
                    Email
                  </td>

                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                    "
                  >
                    ${to}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                      font-weight: bold;
                    "
                  >
                    Role
                  </td>

                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                    "
                  >
                    ${formattedRole}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                      font-weight: bold;
                    "
                  >
                    Temporary Password
                  </td>

                  <td
                    style="
                      border: 1px solid #ddd;
                      padding: 10px;
                      font-family: monospace;
                      font-size: 16px;
                    "
                  >
                    ${temporaryPassword}
                  </td>
                </tr>

              </table>

              <p>
                <a
                  href="${frontendUrl}/login"
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                  "
                >
                  Login to Your Account
                </a>
              </p>

              <div
                style="
                  background-color: #fff7ed;
                  border-left: 4px solid #f97316;
                  padding: 12px 16px;
                  margin-top: 25px;
                  margin-bottom: 20px;
                "
              >

                <h3 style="margin-top: 0;">
                  Important Security Notice
                </h3>

                <p style="margin-bottom: 0;">
                  This is a temporary password provided by the
                  school administration. For your security, please
                  log in and change your password as soon as possible.
                </p>

              </div>

              <p>
                If you did not expect this account to be created,
                please contact the school administration.
              </p>

              <p>
                Regards,<br />
                <strong>School Management System</strong>
              </p>

            </div>

          </div>
        `,
      });

      return {
        message: 'New user credentials email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('New user credentials email error:', error);

      throw new InternalServerErrorException(
        'Failed to send new user credentials email',
      );
    }
  }
}
