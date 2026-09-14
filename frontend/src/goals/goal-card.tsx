'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Focus, FocusStatus, Goal } from '@/api';
import { flowStatusLabel, flowStatusTone } from '@/flows';
import { Badge, Button, Card, CardContent } from '@/ui';
import { GoalProgress, MiniGoalProgress } from './goal-progress';

type GoalCardProps = {
  goal: Goal;
  linkCandidates: Focus[];
  onEdit(goal: Goal): void;
  onDelete(goalId: string): Promise<void>;
  onLink(goalId: string, focusId: string): Promise<void>;
  onUnlink(goalId: string, focusId: string): Promise<void>;
};

export function GoalCard({ goal, linkCandidates, onEdit, onDelete, onLink, onUnlink }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linkingFocusId, setLinkingFocusId] = useState<string | null>(null);
  const linkedFocuses = linkCandidates.filter((candidate) => goal.linkedFocusIds.includes(candidate.id));
  const availableFocuses = linkCandidates.filter((candidate) => !goal.linkedFocusIds.includes(candidate.id));

  async function remove() {
    if (!window.confirm('Are you sure you want to delete this Goal?')) return;
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
    <Card className="p-0 hover:shadow-card-hover sm:p-0">
      <div className="p-4 sm:p-5">
        <button className="grid min-w-0 gap-2 text-left" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm font-semibold text-text-primary">{goal.description}</span>
            <Badge tone={goal.type === 'primary' ? 'info' : 'neutral'}>{goal.type}</Badge>
            {goal.statusOverride ? <Badge tone={flowStatusTone(goal.statusOverride)}>{flowStatusLabel(goal.statusOverride)}</Badge> : null}
          </span>
          <MiniGoalProgress progress={goal.progress} />
        </button>
      </div>

      {expanded ? (
        <CardContent className="grid gap-4 border-t border-border p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <p className="text-sm text-text-muted">{goal.statusOverride ? `Manual status: ${flowStatusLabel(goal.statusOverride)}` : 'Derived from linked Focuses'}</p>
            <div className="flex justify-start gap-2 sm:justify-end">
              <Button variant="secondary" size="sm" onClick={() => onEdit(goal)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => void remove()} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
          <GoalProgress progress={goal.progress} />

          <div className="grid gap-3 rounded-control border border-border bg-surface p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">Linked Focuses</p>
            {linkedFocuses.length > 0 ? (
              <div className="grid gap-2">
                {linkedFocuses.map((focus) => (
                  <div className="grid gap-2 rounded-control bg-surface-muted p-3" key={focus.id}>
                    <Link className="flex items-center justify-between gap-3 hover:text-action" href={`/focuses/${focus.id}`}>
                      <span className="text-sm font-medium text-text-primary">{focus.name}</span>
                      <Badge tone={flowStatusTone(focus.status)}>{flowStatusLabel(focus.status)}</Badge>
                    </Link>
                    <LinkedFocusMeter status={focus.status} />
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => void toggleLink(focus)} disabled={linkingFocusId === focus.id}>
                        Unlink
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-subtle">No linked Focuses yet.</p>
            )}

            {availableFocuses.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {availableFocuses.map((candidate) => (
                  <Button key={candidate.id} variant="ghost" size="sm" onClick={() => void toggleLink(candidate)} disabled={linkingFocusId === candidate.id}>
                    Link {candidate.name}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function LinkedFocusMeter({ status }: { status: FocusStatus }) {
  return (
    <span className="flex h-2 overflow-hidden rounded-full bg-surface ring-1 ring-border" aria-label={`Linked Focus status: ${flowStatusLabel(status)}`}>
      <span className={linkedFocusMeterClass(status)} style={{ width: '100%' }} />
    </span>
  );
}

function linkedFocusMeterClass(status: FocusStatus) {
  switch (status) {
    case 'done':
      return 'bg-success';
    case 'active':
    case 'paused':
    case 'waiting':
      return 'bg-info';
    case 'cancelled':
      return 'bg-danger';
    case 'idea':
    case 'planned':
      return 'bg-border-strong';
  }
}
