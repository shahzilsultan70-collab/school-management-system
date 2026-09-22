import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import OpenAI from 'openai';

import { StudentsService } from '../students/students.service';
import { TeachersService } from '../teachers/teachers.service';
import { FeesService } from '../fees/fees.service';
import { LeavesService } from '../leaves/leaves.service';
import { AdminsService } from '../admins/admins.service';
import { ClassesService } from '../classes/classes.service';
import { RagService } from '../rag/rag.service';

import { LeaveType } from '../leaves/schemas/leave.schema';
import { UserRole } from '../users/schemas/user.schema';

import { AiActionService } from './actions/ai-action.service';
import { AiAction } from './actions/ai-action.types';

interface PendingLeaveData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

interface PendingStudentData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profilePicture?: string | null;
  };
  rollNumber: string;
  className: string;
  section: string;
}

@Injectable()
export class AiService {
  private readonly openai: OpenAI;

  constructor(
    private readonly studentsService: StudentsService,
    private readonly teachersService: TeachersService,
    private readonly feesService: FeesService,
    private readonly leavesService: LeavesService,
    private readonly adminsService: AdminsService,
    private readonly classesService: ClassesService,
    private readonly ragService: RagService,
    private readonly aiActionService: AiActionService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }

  // ============================================================
  // MAIN AI CHAT
  // ============================================================

  async chat(message: string, user: any) {
    const userRole = user?.role;
    const authenticatedUserId = this.getAuthenticatedUserId(user);

    /*
     * ----------------------------------------------------------
     * HANDLE PENDING ACTION CONFIRMATION / CANCELLATION
     * ----------------------------------------------------------
     */

    const pendingAction = authenticatedUserId
      ? this.aiActionService.getPendingAction(authenticatedUserId)
      : null;

    if (pendingAction) {
      const normalizedMessage = this.normalizeConfirmationMessage(message);

      /*
       * IMPORTANT:
       *
       * If a pending action exists and the user confirms it,
       * execute the backend action directly.
       *
       * Do NOT send the confirmation back to the AI.
       */

      if (this.isConfirmation(normalizedMessage)) {
        return await this.confirmPendingAction(user, pendingAction);
      }

      /*
       * If the user cancels the pending action,
       * delete it immediately.
       */

      if (this.isCancellation(normalizedMessage)) {
        if (authenticatedUserId) {
          this.aiActionService.cancelAction(authenticatedUserId);
        }

        return {
          answer: 'Your pending action has been cancelled.',
          action: {
            status: 'cancelled',
          },
        };
      }
    }

    const tools = this.getToolsForRole(userRole);

    /*
     * Add pending action context to the AI.
     *
     * This allows messages such as:
     *
     * "Make it 5 days"
     * "Change the reason"
     * "Change it to emergency"
     * "Change the class to Grade 10"
     */

    let pendingContext = '';

    if (pendingAction?.action === 'create_leave') {
      const pending = this.getLeaveDataFromAction(pendingAction);

      pendingContext = `
CURRENT PENDING ACTION:

The authenticated user has a pending leave application.

Leave type:
${pending.leaveType}

Start date:
${pending.startDate}

End date:
${pending.endDate}

Reason:
${pending.reason}

The user may ask to edit this pending application.

Do NOT create the leave yet.

Use the update_leave_application tool when the user requests changes.

Only create the actual leave after the user explicitly confirms.
`;
    }

    if (pendingAction?.action === 'create_student') {
      const pending = this.getStudentDataFromAction(pendingAction);

      pendingContext = `
CURRENT PENDING ACTION:

The authenticated admin has a pending student creation request.

Student name:
${pending.user.firstName} ${pending.user.lastName}

Email:
${pending.user.email}

Roll number:
${pending.rollNumber}

Class:
${pending.className}

Section:
${pending.section}

A student has NOT been created yet.

The admin may ask to edit this pending student creation request.

Use the update_create_student tool when the admin requests changes.

Only create the actual student after the admin explicitly confirms.
`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `
You are the AI assistant for a School Management System.

Authenticated user:
- User ID: ${authenticatedUserId}
- Role: ${userRole}
- Name: ${
          user?.name ||
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        }

Available roles:
- admin
- teacher
- student

IMPORTANT SECURITY RULES:

1. Never invent school data.
2. Use database tools whenever the user asks for real school database information.
3. Use the school document search tool whenever the user asks about school policies, rules, procedures, announcements, handbook information, or stored documents.
4. Never bypass backend authorization.
5. Never reveal information that the authenticated user is not authorized to access.
6. Never assume the user has a different role.
7. Never expose passwords, password reset tokens, JWTs, API keys, or authentication secrets.
8. If a tool returns an authorization error, explain that the user does not have permission.
9. Keep answers clear and concise.
10. For database information, trust the tool result.
11. For school document information, trust the retrieved documents.
12. Do not invent information that is not present in retrieved documents.

AI ACTION RULES:

13. The AI may prepare actions, but the backend is always the final security boundary.
14. Never use a user-provided student ID or teacher ID to determine ownership.
15. The authenticated JWT user determines ownership.
16. Never directly create, update, delete, approve, or reject a record without the required backend authorization.
17. Normal write actions require a draft/preview first.
18. A leave application must NOT be submitted until the user explicitly confirms it.
19. Student creation must NOT happen until an admin explicitly confirms the student creation draft.
20. If required information is missing, ask the user for it.
21. Users can edit a pending draft naturally.
22. Users can cancel a pending draft.
23. Pending actions belong only to the authenticated user who created them.
24. Never allow one authenticated user to access or confirm another user's pending action.
25. Never expose a student's password after the student creation action has completed.

STUDENT CREATION RULES:

Only an authenticated admin can create students.

When an admin wants to create a student:

1. Understand the student's first name.
2. Understand the student's last name.
3. Understand the student's email.
4. Understand the student's initial password.
5. Understand the student's roll number.
6. Understand the student's class.
7. Understand the student's section.
8. If all required information is available, call prepare_create_student.
9. Do NOT directly create the student.
10. The backend will return a pending student creation draft.
11. Show the admin a clear student creation preview.
12. Ask the admin for explicit confirmation.
13. If the admin requests changes, use update_create_student.
14. Only after explicit confirmation will the backend create the student.
15. The backend automatically generates the official student ID.
16. Never ask the admin to provide the official generated student ID.
17. Never expose the student's password after successful creation.

LEAVE APPLICATION RULES:

When a student or teacher wants leave:

1. Understand the requested leave type.
2. Understand the start date.
3. Understand the end date or calculate it from the requested duration.
4. Understand the reason.
5. If all required information is available, call prepare_leave_application.
6. Do NOT call a real database create operation at this stage.
7. The backend will return a pending draft.
8. Show the user a clear leave application preview.
9. Ask for explicit confirmation.

If the user says things like:

"Make it 5 days"
"Change the reason"
"Change it to emergency"
"Start it on September 25"
"Actually make it 2 days"

then call update_leave_application.

If the user has not provided enough information, ask the user for the missing information instead of guessing.

DATE RULE:

Use ISO date format YYYY-MM-DD when calling leave tools.

The current date is September 16, 2026.

When the user gives a date without a year, automatically use the current year (2026) unless the user clearly specifies a different year.

For example:

"September 20" → "2026-09-20"

"3 days from September 20" → startDate "2026-09-20", endDate "2026-09-22"

"5 days from September 20" → startDate "2026-09-20", endDate "2026-09-24"

Do NOT ask the user for the year when the year is omitted unless the date is genuinely ambiguous.

Always calculate duration inclusively.

PENDING ACTION:

${pendingContext}

ROLE ACCESS:

ADMIN:
- Can view school-wide student information.
- Can view school-wide teacher information.
- Can view school-wide fee information.
- Can view school-wide leave information.
- Can view classes.
- Can search all school documents.
- Can prepare student creation actions.
- Can edit pending student creation actions.
- Can confirm student creation actions.

TEACHER:
- Can view their own teacher profile.
- Can view their own leaves.
- Can search teacher and public school documents.
- Can prepare and submit their own leave.

STUDENT:
- Can view their own student profile.
- Can view their own fees.
- Can view their own leaves.
- Can search student and public school documents.
- Can prepare and submit their own leave.

RAG DOCUMENT RULE:

Documents can be marked:

- all
- admin
- teacher
- student

Only return documents appropriate for the authenticated user's role.

For school documents, prefer retrieved document content over general knowledge.
        `,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    const firstResponse = await this.openai.chat.completions.create({
      model: 'openrouter/free',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const assistantMessage = firstResponse.choices[0]?.message;

    if (!assistantMessage) {
      return {
        answer: 'Sorry, I could not generate a response.',
      };
    }

    messages.push(assistantMessage);

    /*
     * No tool required.
     */

    if (!assistantMessage.tool_calls?.length) {
      return {
        answer:
          assistantMessage.content || 'Sorry, I could not generate a response.',
      };
    }

    /*
     * Execute every tool requested by AI.
     */

    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== 'function') {
        continue;
      }

      const toolName = toolCall.function.name;

      let args: any = {};

      try {
        args = toolCall.function.arguments
          ? JSON.parse(toolCall.function.arguments)
          : {};
      } catch {
        args = {};
      }

      let toolResult: any;

      try {
        toolResult = await this.executeTool(toolName, args, user);
      } catch (error: any) {
        toolResult = {
          error:
            error?.message ||
            'You are not authorized to access this information.',
        };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    /*
     * Ask AI to turn the tool result into a user-friendly response.
     */

    const finalResponse = await this.openai.chat.completions.create({
      model: 'openrouter/free',
      messages,
    });

    return {
      answer:
        finalResponse.choices[0]?.message?.content ||
        'Sorry, I could not generate a response.',
    };
  }

  // ============================================================
  // ROLE BASED TOOLS
  // ============================================================

  private getToolsForRole(
    role: string,
  ): OpenAI.Chat.Completions.ChatCompletionTool[] {
    const ragTool = this.getRagTool();

    /*
     * ADMIN
     */

    if (role === 'admin') {
      return [
        ragTool,

        {
          type: 'function',
          function: {
            name: 'get_all_students',
            description:
              'Get all students in the school. Use this for student counts, student lists, or school-wide student information.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_all_teachers',
            description: 'Get all teachers in the school.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_all_fees',
            description: 'Get all fee records in the school.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_all_leaves',
            description: 'Get all leave records in the school.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_all_classes',
            description: 'Get all classes in the school.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        this.getPrepareCreateStudentTool(),
        this.getUpdateCreateStudentTool(),
      ];
    }

    /*
     * TEACHER
     */

    if (role === 'teacher') {
      return [
        ragTool,

        {
          type: 'function',
          function: {
            name: 'get_my_teacher_profile',
            description: 'Get the authenticated teacher profile.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_my_leaves',
            description: 'Get leaves belonging to the authenticated teacher.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        this.getPrepareLeaveTool(),
        this.getUpdateLeaveTool(),
      ];
    }

    /*
     * STUDENT
     */

    if (role === 'student') {
      return [
        ragTool,

        {
          type: 'function',
          function: {
            name: 'get_my_student_profile',
            description: 'Get the authenticated student profile.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_my_fees',
            description:
              'Get fee records belonging to the authenticated student.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        {
          type: 'function',
          function: {
            name: 'get_my_leaves',
            description: 'Get leaves belonging to the authenticated student.',
            parameters: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
          },
        },

        this.getPrepareLeaveTool(),
        this.getUpdateLeaveTool(),
      ];
    }

    return [];
  }

  // ============================================================
  // STUDENT ACTION TOOLS
  // ============================================================

  private getPrepareCreateStudentTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'prepare_create_student',
        description:
          'Prepare a new student creation action. This DOES NOT create the student. Use only when first name, last name, email, password, roll number, class and section are known.',
        parameters: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'Student first name.',
            },

            lastName: {
              type: 'string',
              description: 'Student last name.',
            },

            email: {
              type: 'string',
              description: 'Student login email address.',
            },

            password: {
              type: 'string',
              description: 'Initial password for the student account.',
            },

            rollNumber: {
              type: 'string',
              description: 'Student roll number.',
            },

            className: {
              type: 'string',
              description: 'Student class, for example Grade 9 or Grade 10.',
            },

            section: {
              type: 'string',
              description: 'Student section, for example A or B.',
            },

            profilePicture: {
              type: 'string',
              description: 'Optional student profile picture path or URL.',
            },
          },

          required: [
            'firstName',
            'lastName',
            'email',
            'password',
            'rollNumber',
            'className',
            'section',
          ],

          additionalProperties: false,
        },
      },
    };
  }

  private getUpdateCreateStudentTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'update_create_student',
        description:
          'Update the authenticated admin pending student creation draft. This DOES NOT create the student.',
        parameters: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'Updated student first name.',
            },

            lastName: {
              type: 'string',
              description: 'Updated student last name.',
            },

            email: {
              type: 'string',
              description: 'Updated student email.',
            },

            password: {
              type: 'string',
              description: 'Updated initial student password.',
            },

            rollNumber: {
              type: 'string',
              description: 'Updated student roll number.',
            },

            className: {
              type: 'string',
              description: 'Updated student class.',
            },

            section: {
              type: 'string',
              description: 'Updated student section.',
            },
          },

          additionalProperties: false,
        },
      },
    };
  }

  // ============================================================
  // LEAVE ACTION TOOLS
  // ============================================================

  private getPrepareLeaveTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'prepare_leave_application',
        description:
          'Prepare a leave application draft. This DOES NOT submit the leave. Use only when leave type, start date, end date and reason are known.',
        parameters: {
          type: 'object',
          properties: {
            leaveType: {
              type: 'string',
              enum: ['sick', 'casual', 'emergency', 'family', 'other'],
              description: 'Type of leave.',
            },

            startDate: {
              type: 'string',
              description: 'Leave start date in YYYY-MM-DD format.',
            },

            endDate: {
              type: 'string',
              description: 'Leave end date in YYYY-MM-DD format.',
            },

            reason: {
              type: 'string',
              description: 'Reason for the leave.',
            },
          },

          required: ['leaveType', 'startDate', 'endDate', 'reason'],

          additionalProperties: false,
        },
      },
    };
  }

  private getUpdateLeaveTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: 'update_leave_application',
        description:
          'Update the authenticated user pending leave application. Use when the user wants to edit the draft.',
        parameters: {
          type: 'object',
          properties: {
            leaveType: {
              type: 'string',
              enum: ['sick', 'casual', 'emergency', 'family', 'other'],
            },

            startDate: {
              type: 'string',
              description: 'Updated start date in YYYY-MM-DD format.',
            },

            endDate: {
              type: 'string',
              description: 'Updated end date in YYYY-MM-DD format.',
            },

            reason: {
              type: 'string',
              description: 'Updated leave reason.',
            },
          },

          additionalProperties: false,
        },
      },
    };
  }

  // ============================================================
  // RAG TOOL
  // ============================================================

  private getRagTool(): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
      type: 'function',

      function: {
        name: 'search_school_documents',

        description:
          'Search official school documents, policies, rules, procedures, announcements, handbook information, and other school knowledge. Use this when the answer should come from school documents.',

        parameters: {
          type: 'object',

          properties: {
            query: {
              type: 'string',
              description:
                'The question or information to search for in school documents.',
            },
          },

          required: ['query'],

          additionalProperties: false,
        },
      },
    };
  }

  // ============================================================
  // TOOL EXECUTION
  // ============================================================

  private async executeTool(toolName: string, args: any, user: any) {
    switch (toolName) {
      case 'search_school_documents':
        return this.searchSchoolDocuments(args?.query, user);

      case 'get_all_students':
        return this.getAllStudents(user);

      case 'get_all_teachers':
        return this.getAllTeachers(user);

      case 'get_all_fees':
        return this.getAllFees(user);

      case 'get_all_leaves':
        return this.getAllLeaves(user);

      case 'get_all_classes':
        return this.getAllClasses(user);

      case 'get_my_teacher_profile':
        return this.getMyTeacherProfile(user);

      case 'get_my_student_profile':
        return this.getMyStudentProfile(user);

      case 'get_my_fees':
        return this.getMyFees(user);

      case 'get_my_leaves':
        return this.getMyLeaves(user);

      case 'prepare_leave_application':
        return this.prepareLeaveApplication(args, user);

      case 'update_leave_application':
        return this.updateLeaveApplication(args, user);

      case 'prepare_create_student':
        return this.prepareCreateStudent(args, user);

      case 'update_create_student':
        return this.updateCreateStudent(args, user);

      default:
        throw new ForbiddenException('This AI tool is not available.');
    }
  }

  // ============================================================
  // PREPARE STUDENT CREATION
  // ============================================================

  private async prepareCreateStudent(args: any, user: any) {
    this.ensureRole(user, [UserRole.ADMIN]);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    const firstName = args?.firstName?.trim();
    const lastName = args?.lastName?.trim();
    const email = args?.email?.trim().toLowerCase();
    const password = args?.password;
    const rollNumber = args?.rollNumber?.trim();
    const className = args?.className?.trim();
    const section = args?.section?.trim();
    const profilePicture = args?.profilePicture?.trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !rollNumber ||
      !className ||
      !section
    ) {
      throw new BadRequestException(
        'First name, last name, email, password, roll number, class, and section are required.',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'Student password must be at least 6 characters.',
      );
    }

    const pendingAction = this.aiActionService.prepareAction(
      'create_student',
      userId,
      user.role,
      {
        user: {
          firstName,
          lastName,
          email,
          password,
          profilePicture: profilePicture || null,
        },
        rollNumber,
        className,
        section,
      },
    );

    const pending = this.getStudentDataFromAction(pendingAction);

    return {
      success: true,
      status: 'pending_confirmation',
      action: 'create_student',
      message:
        'Student creation prepared. The student has NOT been created yet.',
      draft: {
        firstName: pending.user.firstName,
        lastName: pending.user.lastName,
        email: pending.user.email,
        password: pending.user.password,
        rollNumber: pending.rollNumber,
        className: pending.className,
        section: pending.section,
      },
      nextStep:
        'Show the draft to the admin and ask for explicit confirmation.',
    };
  }

  // ============================================================
  // UPDATE STUDENT CREATION DRAFT
  // ============================================================

  private async updateCreateStudent(args: any, user: any) {
    this.ensureRole(user, [UserRole.ADMIN]);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    const pendingAction = this.aiActionService.getPendingAction(userId);

    if (!pendingAction || pendingAction.action !== 'create_student') {
      return {
        success: false,
        message: 'There is no pending student creation action to edit.',
      };
    }

    const current = this.getStudentDataFromAction(pendingAction);

    const updatedData: PendingStudentData = {
      user: {
        firstName: current.user.firstName,
        lastName: current.user.lastName,
        email: current.user.email,
        password: current.user.password,
        profilePicture: current.user.profilePicture ?? null,
      },
      rollNumber: current.rollNumber,
      className: current.className,
      section: current.section,
    };

    if (typeof args?.firstName === 'string') {
      updatedData.user.firstName = args.firstName.trim();
    }

    if (typeof args?.lastName === 'string') {
      updatedData.user.lastName = args.lastName.trim();
    }

    if (typeof args?.email === 'string') {
      updatedData.user.email = args.email.trim().toLowerCase();
    }

    if (typeof args?.password === 'string') {
      if (args.password.length < 6) {
        throw new BadRequestException(
          'Student password must be at least 6 characters.',
        );
      }

      updatedData.user.password = args.password;
    }

    if (typeof args?.rollNumber === 'string') {
      updatedData.rollNumber = args.rollNumber.trim();
    }

    if (typeof args?.className === 'string') {
      updatedData.className = args.className.trim();
    }

    if (typeof args?.section === 'string') {
      updatedData.section = args.section.trim();
    }

    if (
      !updatedData.user.firstName ||
      !updatedData.user.lastName ||
      !updatedData.user.email ||
      !updatedData.user.password ||
      !updatedData.rollNumber ||
      !updatedData.className ||
      !updatedData.section
    ) {
      throw new BadRequestException(
        'The student creation draft is missing required information.',
      );
    }

    const updatedAction = this.aiActionService.updateAction(
      userId,
      user.role,
      updatedData as unknown as Record<string, unknown>,
    );

    const updated = this.getStudentDataFromAction(updatedAction);

    return {
      success: true,
      status: 'pending_confirmation',
      action: 'create_student',
      message:
        'Student creation draft updated. The student has NOT been created yet.',
      draft: {
        firstName: updated.user.firstName,
        lastName: updated.user.lastName,
        email: updated.user.email,
        password: updated.user.password,
        rollNumber: updated.rollNumber,
        className: updated.className,
        section: updated.section,
      },
      nextStep:
        'Show the updated draft to the admin and ask for explicit confirmation.',
    };
  }

  // ============================================================
  // PREPARE LEAVE
  // ============================================================

  private async prepareLeaveApplication(args: any, user: any) {
    this.ensureRole(user, ['student', 'teacher']);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    if (!Object.values(LeaveType).includes(args?.leaveType as LeaveType)) {
      throw new ForbiddenException('Invalid leave type.');
    }

    const startDate = new Date(args.startDate);
    const endDate = new Date(args.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ForbiddenException('Invalid leave dates.');
    }

    if (endDate < startDate) {
      throw new ForbiddenException('End date cannot be before start date.');
    }

    if (!args.reason || args.reason.trim().length < 3) {
      throw new ForbiddenException('A valid leave reason is required.');
    }

    const pendingAction = this.aiActionService.prepareAction(
      'create_leave',
      userId,
      user.role,
      {
        leaveType: args.leaveType,
        startDate: args.startDate,
        endDate: args.endDate,
        reason: args.reason.trim(),
      },
    );

    const pending = this.getLeaveDataFromAction(pendingAction);

    return {
      success: true,
      status: 'pending_confirmation',
      action: 'create_leave',
      message: 'Leave application prepared. It has NOT been submitted yet.',
      draft: {
        leaveType: pending.leaveType,
        startDate: pending.startDate,
        endDate: pending.endDate,
        reason: pending.reason,
      },
      nextStep: 'Show the draft to the user and ask for explicit confirmation.',
    };
  }

  // ============================================================
  // UPDATE LEAVE DRAFT
  // ============================================================

  private async updateLeaveApplication(args: any, user: any) {
    this.ensureRole(user, ['student', 'teacher']);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    const pendingAction = this.aiActionService.getPendingAction(userId);

    if (!pendingAction || pendingAction.action !== 'create_leave') {
      return {
        success: false,
        message: 'There is no pending leave application to edit.',
      };
    }

    const current = this.getLeaveDataFromAction(pendingAction);

    const updatedData: PendingLeaveData = {
      leaveType: args.leaveType || current.leaveType,
      startDate: args.startDate || current.startDate,
      endDate: args.endDate || current.endDate,
      reason: args.reason?.trim() || current.reason,
    };

    const startDate = new Date(updatedData.startDate);
    const endDate = new Date(updatedData.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ForbiddenException('Invalid leave dates.');
    }

    if (endDate < startDate) {
      throw new ForbiddenException('End date cannot be before start date.');
    }

    if (
      !Object.values(LeaveType).includes(updatedData.leaveType as LeaveType)
    ) {
      throw new ForbiddenException('Invalid leave type.');
    }

    if (!updatedData.reason || updatedData.reason.trim().length < 3) {
      throw new ForbiddenException('A valid leave reason is required.');
    }

    const updatedAction = this.aiActionService.updateAction(
      userId,
      user.role,
      updatedData as unknown as Record<string, unknown>,
    );

    const updated = this.getLeaveDataFromAction(updatedAction);

    return {
      success: true,
      status: 'pending_confirmation',
      action: 'update_leave',
      message: 'Leave application updated. It has NOT been submitted yet.',
      draft: {
        leaveType: updated.leaveType,
        startDate: updated.startDate,
        endDate: updated.endDate,
        reason: updated.reason,
      },
      nextStep: 'Show the updated draft and ask for explicit confirmation.',
    };
  }

  // ============================================================
  // CONFIRM PENDING ACTION
  // ============================================================

  private async confirmPendingAction(user: any, pendingAction: AiAction) {
    switch (pendingAction.action) {
      case 'create_leave':
        return this.confirmPendingLeave(user, pendingAction);

      case 'create_student':
        return this.confirmPendingStudent(user, pendingAction);

      default:
        throw new ForbiddenException(
          `The pending action "${pendingAction.action}" cannot be executed yet.`,
        );
    }
  }

  // ============================================================
  // CONFIRM PENDING STUDENT
  // ============================================================

  private async confirmPendingStudent(user: any, pendingAction: AiAction) {
    this.ensureRole(user, [UserRole.ADMIN]);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    /*
     * Verify that the pending action belongs to
     * the authenticated admin.
     */

    if (pendingAction.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to confirm this action.',
      );
    }

    if (pendingAction.role !== user.role) {
      throw new ForbiddenException(
        'The pending action role does not match the authenticated role.',
      );
    }

    const pending = this.getStudentDataFromAction(pendingAction);

    /*
     * IMPORTANT:
     *
     * We call the existing StudentsService.
     *
     * StudentsService is responsible for:
     *
     * - checking duplicate email
     * - generating student ID
     * - hashing password
     * - creating the User
     * - creating the Student
     * - rolling back the User if Student creation fails
     */

    const result = await this.studentsService.create({
      user: {
        firstName: pending.user.firstName,
        lastName: pending.user.lastName,
        email: pending.user.email,
        password: pending.user.password,
        profilePicture: pending.user.profilePicture ?? null,
      },
      rollNumber: pending.rollNumber,
      className: pending.className,
      section: pending.section,
    });

    /*
     * Delete the pending action only after the database
     * operation succeeds.
     */

    this.aiActionService.removePendingAction(userId);

    /*
     * Do not expose the password in the AI response.
     */

    const resultStudent = result?.student;

    return {
      answer: 'Student created successfully.',
      action: {
        status: 'completed',
        type: 'create_student',
      },
      student: resultStudent
        ? {
            studentId: resultStudent.studentId,
            rollNumber: resultStudent.rollNumber,
            className: resultStudent.className,
            section: resultStudent.section,
            isActive: resultStudent.isActive,
            firstName: resultStudent.user?.firstName,
            lastName: resultStudent.user?.lastName,
            email: resultStudent.user?.email,
          }
        : undefined,
    };
  }

  // ============================================================
  // CONFIRM PENDING LEAVE
  // ============================================================

  private async confirmPendingLeave(user: any, pendingAction: AiAction) {
    this.ensureRole(user, ['student', 'teacher']);

    const userId = this.getAuthenticatedUserId(user);

    if (!userId) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    /*
     * Verify that the pending action belongs to the
     * authenticated user.
     */

    if (pendingAction.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to confirm this action.',
      );
    }

    if (pendingAction.role !== user.role) {
      throw new ForbiddenException(
        'The pending action role does not match the authenticated role.',
      );
    }

    const pending = this.getLeaveDataFromAction(pendingAction);

    /*
     * IMPORTANT:
     *
     * We use the authenticated JWT user here.
     *
     * We do NOT accept studentId/userId from the AI.
     */

    const result = await this.leavesService.create(
      {
        leaveType: pending.leaveType,
        startDate: pending.startDate,
        endDate: pending.endDate,
        reason: pending.reason,
      },
      user,
    );

    /*
     * Delete the pending action only after the database
     * operation succeeds.
     */

    this.aiActionService.removePendingAction(userId);

    return {
      answer: 'Your leave application has been submitted successfully.',
      action: {
        status: 'submitted',
        type: 'create_leave',
      },
      result,
    };
  }

  // ============================================================
  // CONVERT GENERIC ACTION DATA TO LEAVE DATA
  // ============================================================

  private getLeaveDataFromAction(action: AiAction): PendingLeaveData {
    if (action.action !== 'create_leave') {
      throw new ForbiddenException('The pending action is not a leave action.');
    }

    const data = action.data;

    return {
      leaveType: data.leaveType as LeaveType,
      startDate: String(data.startDate),
      endDate: String(data.endDate),
      reason: String(data.reason),
    };
  }

  // ============================================================
  // CONVERT GENERIC ACTION DATA TO STUDENT DATA
  // ============================================================

  private getStudentDataFromAction(action: AiAction): PendingStudentData {
    if (action.action !== 'create_student') {
      throw new ForbiddenException(
        'The pending action is not a student creation action.',
      );
    }

    const data = action.data;
    const userData = data.user as Record<string, unknown>;

    return {
      user: {
        firstName: String(userData.firstName),
        lastName: String(userData.lastName),
        email: String(userData.email),
        password: String(userData.password),
        profilePicture:
          userData.profilePicture !== undefined
            ? String(userData.profilePicture)
            : null,
      },
      rollNumber: String(data.rollNumber),
      className: String(data.className),
      section: String(data.section),
    };
  }

  // ============================================================
  // CONFIRMATION HELPERS
  // ============================================================

  private normalizeConfirmationMessage(message: string) {
    return message
      .trim()
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .replace(/\s+/g, ' ');
  }

  private isConfirmation(message: string) {
    const normalized = this.normalizeConfirmationMessage(message);

    return /^(yes|yes please|confirm|confirmed|submit|submit it|submit this|apply|apply it|apply this|send|send it|send this|okay|ok|proceed|go ahead|yes submit|yes submit it|yes apply|yes apply it|please submit|please submit it|please apply|please apply it)$/.test(
      normalized,
    );
  }

  private isCancellation(message: string) {
    const normalized = this.normalizeConfirmationMessage(message);

    return /^(cancel|cancel it|cancel this|no|no thanks|discard|discard it|never mind|nevermind)$/.test(
      normalized,
    );
  }

  // ============================================================
  // AUTHENTICATED USER ID
  // ============================================================

  private getAuthenticatedUserId(user: any): string | null {
    const userId = user?.userId || user?.id || user?.sub;

    return userId ? userId.toString() : null;
  }

  // ============================================================
  // RAG SEARCH
  // ============================================================

  private async searchSchoolDocuments(query: string, user: any) {
    this.ensureRole(user, ['admin', 'teacher', 'student']);

    if (!query) {
      return {
        error: 'A search query is required.',
      };
    }

    const results = await this.ragService.search(query, 5, user.role);

    return {
      query,
      results,
    };
  }

  // ============================================================
  // AUTHORIZATION
  // ============================================================

  private ensureRole(user: any, allowedRoles: string[]) {
    if (!allowedRoles.includes(user?.role)) {
      throw new ForbiddenException(
        'You are not authorized to access this information.',
      );
    }
  }

  // ============================================================
  // ADMIN: ALL STUDENTS
  // ============================================================

  private async getAllStudents(user: any) {
    this.ensureRole(user, ['admin']);

    const students = await this.studentsService.findAll();

    return students.map((student: any) => {
      const studentUser: any = student.userId;

      return {
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        className: student.className,
        section: student.section,
        isActive: student.isActive,
        firstName: studentUser?.firstName,
        lastName: studentUser?.lastName,
        email: studentUser?.email,
      };
    });
  }

  // ============================================================
  // ADMIN: ALL TEACHERS
  // ============================================================

  private async getAllTeachers(user: any) {
    this.ensureRole(user, ['admin']);

    const teachers = await this.teachersService.findAll();

    return teachers.map((teacher: any) => {
      const teacherUser: any = teacher.userId;

      return {
        id: teacher._id,
        firstName: teacherUser?.firstName,
        lastName: teacherUser?.lastName,
        email: teacherUser?.email,
        isActive: teacher.isActive,
      };
    });
  }

  // ============================================================
  // ADMIN: ALL FEES
  // ============================================================

  private async getAllFees(user: any) {
    this.ensureRole(user, ['admin']);

    return this.feesService.findAll();
  }

  // ============================================================
  // ADMIN: ALL LEAVES
  // ============================================================

  private async getAllLeaves(user: any) {
    this.ensureRole(user, ['admin']);

    return this.leavesService.findAll(user);
  }

  // ============================================================
  // ADMIN: ALL CLASSES
  // ============================================================

  private async getAllClasses(user: any) {
    this.ensureRole(user, ['admin']);

    return this.classesService.findAll();
  }

  // ============================================================
  // TEACHER: MY PROFILE
  // ============================================================

  private async getMyTeacherProfile(user: any) {
    this.ensureRole(user, ['teacher']);

    const teachers = await this.teachersService.findAll();

    const authenticatedUserId = this.getAuthenticatedUserId(user);

    const teacher = teachers.find((item: any) => {
      const populatedUserId = item.userId?._id?.toString();
      const rawUserId = item.userId?.toString();

      return (
        populatedUserId === authenticatedUserId ||
        rawUserId === authenticatedUserId
      );
    });

    if (!teacher) {
      return {
        message: 'Teacher profile not found.',
      };
    }

    const teacherUser: any = teacher.userId;

    return {
      id: teacher._id,
      firstName: teacherUser?.firstName,
      lastName: teacherUser?.lastName,
      email: teacherUser?.email,
      isActive: teacher.isActive,
    };
  }

  // ============================================================
  // STUDENT: MY PROFILE
  // ============================================================

  private async getMyStudentProfile(user: any) {
    this.ensureRole(user, ['student']);

    const students = await this.studentsService.findAll();

    const authenticatedUserId = this.getAuthenticatedUserId(user);

    const student = students.find((item: any) => {
      const populatedUserId = item.userId?._id?.toString();
      const rawUserId = item.userId?.toString();

      return (
        populatedUserId === authenticatedUserId ||
        rawUserId === authenticatedUserId
      );
    });

    if (!student) {
      return {
        message: 'Student profile not found.',
      };
    }

    const studentUser: any = student.userId;

    return {
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      className: student.className,
      section: student.section,
      isActive: student.isActive,
      firstName: studentUser?.firstName,
      lastName: studentUser?.lastName,
      email: studentUser?.email,
    };
  }

  // ============================================================
  // STUDENT: MY FEES
  // ============================================================

  private async getMyFees(user: any) {
    this.ensureRole(user, ['student']);

    const students = await this.studentsService.findAll();

    const authenticatedUserId = this.getAuthenticatedUserId(user);

    const student = students.find((item: any) => {
      const populatedUserId = item.userId?._id?.toString();
      const rawUserId = item.userId?.toString();

      return (
        populatedUserId === authenticatedUserId ||
        rawUserId === authenticatedUserId
      );
    });

    if (!student) {
      return {
        message: 'Student profile not found.',
      };
    }

    return this.feesService.findByStudent(student._id.toString());
  }

  // ============================================================
  // STUDENT / TEACHER: MY LEAVES
  // ============================================================

  private async getMyLeaves(user: any) {
    this.ensureRole(user, ['student', 'teacher']);

    return this.leavesService.findMyLeaves(user);
  }
}
