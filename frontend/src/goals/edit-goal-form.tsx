'use client';

import { useState, type FormEvent } from 'react';
import type { FocusStatus, Goal, GoalType, UpdateGoalInput } from '@/api';
import { flowStatusLabel } from '@/flows';
import { Button, Field, Select, Textarea } from '@/ui';
import { buildUpdateGoalInput } from './goal-forms';

const goalTypes: GoalType[] = ['primary', 'secondary'];
const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type EditGoalFormProps = {
  goal: Goal;
  onSave(goalId: string, input: UpdateGoalInput): Promise<void>;
  onSaved?(): void;
};

export function EditGoalForm({ goal, onSave, onSaved }: EditGoalFormProps) {
  const [type, setType] = useState<GoalType>(goal.type);
  const [description, setDescription] = useState(goal.description);
  const [statusOverride, setStatusOverride] = useState<FocusStatus | ''>(goal.statusOverride ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildUpdateGoalInput({ type, description, statusOverride });
    if (!input) {
      setError('Goal description is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(goal.id, input);
      onSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field label="Type">
        <Select value={type} onChange={(event) => setType(event.target.value as GoalType)} disabled={saving}>
          {goalTypes.map((nextType) => (
            <option key={nextType} value={nextType}>
              {nextType}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" error={error ?? undefined}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={saving} />
      </Field>

      <Field label="Status override" description="Leave empty to derive progress from linked Focuses.">
        <Select value={statusOverride} onChange={(event) => setStatusOverride(event.target.value as FocusStatus | '')} disabled={saving}>
          <option value="">Derived</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {flowStatusLabel(status)}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Goal'}
      </Button>
    </form>
  );
}
