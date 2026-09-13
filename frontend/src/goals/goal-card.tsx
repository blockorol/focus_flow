'use client';

import { useState, type FormEvent } from 'react';
import type { Focus, FocusStatus, Goal, GoalType, UpdateGoalInput } from '@/api';
import { flowStatusLabel } from '@/flows';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Select, Textarea } from '@/ui';
import { buildUpdateGoalInput } from './goal-forms';
import { GoalProgress } from './goal-progress';

const goalTypes: GoalType[] = ['primary', 'secondary'];
const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type GoalCardProps = {
  goal: Goal;
  linkCandidates: Focus[];
  onSave(goalId: string, input: UpdateGoalInput): Promise<void>;
  onDelete(goalId: string): Promise<void>;
  onLink(goalId: string, focusId: string): Promise<void>;
  onUnlink(goalId: string, focusId: string): Promise<void>;
};

export function GoalCard({ goal, linkCandidates, onSave, onDelete, onLink, onUnlink }: GoalCardProps) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<GoalType>(goal.type);
  const [description, setDescription] = useState(goal.description);
  const [statusOverride, setStatusOverride] = useState<FocusStatus | ''>(goal.statusOverride ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkingFocusId, setLinkingFocusId] = useState<string | null>(null);

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
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(goal.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal could not be deleted.');
      setDeleting(false);
    }
  }

  async function toggleLink(candidate: Focus) {
    setLinkingFocusId(candidate.id);
    setError(null);
    try {
      if (goal.linkedFocusIds.includes(candidate.id)) {
        await onUnlink(goal.id, candidate.id);
      } else {
        await onLink(goal.id, candidate.id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Goal link could not be updated.');
    } finally {
      setLinkingFocusId(null);
    }
  }

  return (
    <Card className="hover:shadow-card-hover">
      <CardHeader>
        <div>
          <CardTitle>{goal.description}</CardTitle>
          <p className="mt-1 text-sm text-text-muted">{goal.statusOverride ? `Manual status: ${flowStatusLabel(goal.statusOverride)}` : 'Derived from linked Focuses'}</p>
        </div>
        <Badge tone={goal.type === 'primary' ? 'info' : 'neutral'}>{goal.type}</Badge>
      </CardHeader>

      <CardContent className="grid gap-4">
        <GoalProgress progress={goal.progress} />

        {linkCandidates.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">Linked Focuses</p>
            <div className="flex flex-wrap gap-2">
              {linkCandidates.map((candidate) => {
                const linked = goal.linkedFocusIds.includes(candidate.id);
                return (
                  <Button key={candidate.id} variant={linked ? 'secondary' : 'ghost'} size="sm" onClick={() => void toggleLink(candidate)} disabled={linkingFocusId === candidate.id}>
                    {linked ? 'Unlink' : 'Link'} {candidate.name}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}

        {editing ? (
          <form className="grid gap-4 border-t border-border pt-4" onSubmit={submit}>
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

            <Field label="Status override">
              <Select value={statusOverride} onChange={(event) => setStatusOverride(event.target.value as FocusStatus | '')} disabled={saving}>
                <option value="">Derived</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {flowStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Goal'}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => void remove()} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}

        {error && !editing ? <p className="text-sm text-danger">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
