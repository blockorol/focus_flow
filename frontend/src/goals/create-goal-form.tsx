'use client';

import { useState, type FormEvent } from 'react';
import type { CreateGoalInput, FocusStatus, GoalType } from '@/api';
import { flowStatusLabel } from '@/flows';
import { Button, Field, Select, Textarea } from '@/ui';
import { buildCreateGoalInput } from './goal-forms';

const goalTypes: GoalType[] = ['primary', 'secondary'];
const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type CreateGoalFormProps = {
  onCreate(input: CreateGoalInput): Promise<void>;
  onCreated?(): void;
};

export function CreateGoalForm({ onCreate, onCreated }: CreateGoalFormProps) {
  const [type, setType] = useState<GoalType>('primary');
  const [description, setDescription] = useState('');
  const [statusOverride, setStatusOverride] = useState<FocusStatus | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildCreateGoalInput({ type, description, statusOverride });
    if (!input) {
      setError('Goal description is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate(input);
      setType('primary');
      setDescription('');
      setStatusOverride('');
      onCreated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field label="Type">
        <Select value={type} onChange={(event) => setType(event.target.value as GoalType)} disabled={submitting}>
          {goalTypes.map((nextType) => (
            <option key={nextType} value={nextType}>
              {nextType}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description" error={error ?? undefined}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should be true when this is complete?" disabled={submitting} />
      </Field>

      <Field label="Status override" description="Leave empty to derive progress from linked Focuses.">
        <Select value={statusOverride} onChange={(event) => setStatusOverride(event.target.value as FocusStatus | '')} disabled={submitting}>
          <option value="">Derived</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {flowStatusLabel(status)}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Add Goal'}
      </Button>
    </form>
  );
}

