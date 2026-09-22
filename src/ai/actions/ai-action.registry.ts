import { AiActionType } from './ai-action.types';

interface ActionPermission {
  roles: string[];
  requiresConfirmation: boolean;
}

export const AI_ACTION_REGISTRY: Record<AiActionType, ActionPermission> = {
  create_leave: {
    roles: ['student', 'teacher'],
    requiresConfirmation: true,
  },

  update_profile: {
    roles: ['student', 'teacher', 'admin'],
    requiresConfirmation: true,
  },

  create_student: {
    roles: ['admin'],
    requiresConfirmation: true,
  },

  create_teacher: {
    roles: ['admin'],
    requiresConfirmation: true,
  },

  add_fee: {
    roles: ['admin'],
    requiresConfirmation: true,
  },

  approve_leave: {
    roles: ['admin'],
    requiresConfirmation: true,
  },

  reject_leave: {
    roles: ['admin'],
    requiresConfirmation: true,
  },
};
