import { Injectable, ForbiddenException } from '@nestjs/common';

import { AiAction, AiActionType } from './ai-action.types';

import { AI_ACTION_REGISTRY } from './ai-action.registry';

@Injectable()
export class AiActionService {
  /**
   * Pending actions are kept in memory for now.
   *
   * Key = authenticated user ID
   */
  private readonly pendingActions = new Map<string, AiAction>();

  /**
   * Check whether the authenticated user can perform an action.
   */
  checkPermission(action: AiActionType, role: string): void {
    const permission = AI_ACTION_REGISTRY[action];

    if (!permission) {
      throw new ForbiddenException(`AI action "${action}" is not registered.`);
    }

    if (!permission.roles.includes(role)) {
      throw new ForbiddenException(
        `Role "${role}" is not allowed to perform "${action}".`,
      );
    }
  }

  /**
   * Check whether an action requires explicit confirmation.
   */
  requiresConfirmation(action: AiActionType): boolean {
    const permission = AI_ACTION_REGISTRY[action];

    if (!permission) {
      throw new ForbiddenException(`AI action "${action}" is not registered.`);
    }

    return permission.requiresConfirmation;
  }

  /**
   * Prepare and store a pending action.
   */
  prepareAction(
    action: AiActionType,
    userId: string,
    role: string,
    data: Record<string, unknown>,
  ): AiAction {
    this.checkPermission(action, role);

    const pendingAction: AiAction = {
      action,
      userId,
      role,
      data,
      status: 'pending',
      createdAt: new Date(),
    };

    this.pendingActions.set(userId, pendingAction);

    return pendingAction;
  }

  /**
   * Get the current pending action for a user.
   */
  getPendingAction(userId: string): AiAction | null {
    return this.pendingActions.get(userId) ?? null;
  }

  /**
   * Update a pending action.
   */
  updateAction(
    userId: string,
    role: string,
    data: Record<string, unknown>,
  ): AiAction {
    const pendingAction = this.pendingActions.get(userId);

    if (!pendingAction) {
      throw new ForbiddenException('There is no pending AI action.');
    }

    this.checkPermission(pendingAction.action, role);

    if (pendingAction.role !== role) {
      throw new ForbiddenException(
        'The action role does not match the authenticated role.',
      );
    }

    const updatedAction: AiAction = {
      ...pendingAction,
      data: {
        ...pendingAction.data,
        ...data,
      },
      status: 'pending',
    };

    this.pendingActions.set(userId, updatedAction);

    return updatedAction;
  }

  /**
   * Confirm a pending action.
   *
   * The action is removed only after successful execution.
   */
  removePendingAction(userId: string): void {
    this.pendingActions.delete(userId);
  }

  /**
   * Cancel a pending action.
   */
  cancelAction(userId: string): boolean {
    return this.pendingActions.delete(userId);
  }
}
