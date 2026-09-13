import type { CreateGoalInput, FocusStatus, GoalType, UpdateGoalInput } from '@/api';

export type GoalDraft = {
  type: GoalType;
  description: string;
  statusOverride: FocusStatus | '';
};

export function buildCreateGoalInput(draft: GoalDraft): CreateGoalInput | null {
  const description = draft.description.trim();
  if (!description) return null;
  return {
    type: draft.type,
    description,
    statusOverride: draft.statusOverride || null,
  };
}

export function buildUpdateGoalInput(draft: GoalDraft): UpdateGoalInput | null {
  const description = draft.description.trim();
  if (!description) return null;

  const input: UpdateGoalInput = {
    type: draft.type,
    description,
  };

  if (draft.statusOverride) {
    input.statusOverride = draft.statusOverride;
  } else {
    input.clearFields = ['statusOverride'];
  }

  return input;
}

