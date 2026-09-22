import { LeaveType } from '../../leaves/schemas/leave.schema';

export type AiActionType =
  | 'create_leave'
  | 'update_profile'
  | 'create_student'
  | 'create_teacher'
  | 'add_fee'
  | 'approve_leave'
  | 'reject_leave';

export type AiActionStatus =
  'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface CreateLeaveActionData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface CreateStudentActionData {
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

export interface AiAction {
  action: AiActionType;
  userId: string;
  role: string;
  data: Record<string, unknown>;
  status: AiActionStatus;
  createdAt: Date;
}
