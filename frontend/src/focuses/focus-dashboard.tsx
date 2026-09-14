'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppAPIError, type CreateFocusInput, type CreateGoalInput, type Focus, type FocusFlowAPI, type FocusStatus, type UpdateFocusInput, type UpdateGoalInput } from '@/api';
import { getBrowserAPI } from '@/api/browser';
import { CreateGoalForm, GoalsPanel } from '@/goals';
import { Button, EmptyState, ErrorState, LoadingState, Modal } from '@/ui';
import { ChildFocusCard } from './child-focus-card';
import { CreateChildFocusForm } from './create-child-focus-form';
import { FocusEditForm } from './focus-edit-form';
import { FocusSummary } from './focus-summary';

type CreateChildFocusInput = Omit<CreateFocusInput, 'parentId'>;

type FocusDashboardProps = {
  focusId: string;
};

export function FocusDashboard({ focusId }: FocusDashboardProps) {
  const [focus, setFocus] = useState<Focus | null>(null);
  const [focusPath, setFocusPath] = useState<Focus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createChildModalOpen, setCreateChildModalOpen] = useState(false);
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const readFocus = useCallback(async () => {
    const api = getBrowserAPI();
    const nextFocus = await api.getFocus(focusId, { include: ['children', 'goals'], depth: 1 });
    const nextPath = await buildFocusPath(api, nextFocus);
    return { nextFocus, nextPath };
  }, [focusId]);

  async function refreshFocus() {
    const { nextFocus, nextPath } = await readFocus();
    setFocus(nextFocus);
    setFocusPath(nextPath);
    return nextFocus;
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { nextFocus, nextPath } = await readFocus();
        if (!active) return;
        setFocus(nextFocus);
        setFocusPath(nextPath);
        setError(null);
        setActionError(null);
      } catch (cause) {
        if (!active) return;
        setError(errorMessage(cause));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [readFocus]);

  async function retry() {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      await refreshFocus();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  async function createChild(input: CreateChildFocusInput) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.createFocus({ ...input, parentId: focusId });
    await refreshFocus();
  }

  async function updateFocus(input: UpdateFocusInput) {
    const api = getBrowserAPI();
    setActionError(null);
    const updated = await api.updateFocus(focusId, input);
    const reloaded = await refreshFocus();
    return { ...updated, children: reloaded.children, goals: reloaded.goals };
  }

  async function updateFocusStatus(status: FocusStatus) {
    setStatusSaving(true);
    setActionError(null);
    try {
      await updateFocus({ status });
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setStatusSaving(false);
    }
  }

  async function createGoal(input: CreateGoalInput) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.createGoal(focusId, input);
    await refreshFocus();
  }

  async function updateGoal(goalId: string, input: UpdateGoalInput) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.updateGoal(goalId, input);
    await refreshFocus();
  }

  async function deleteGoal(goalId: string) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.deleteGoal(goalId);
    await refreshFocus();
  }

  async function linkGoal(goalId: string, linkedFocusId: string) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.linkGoalFocus(goalId, { focusId: linkedFocusId });
    await refreshFocus();
  }

  async function unlinkGoal(goalId: string, linkedFocusId: string) {
    const api = getBrowserAPI();
    setActionError(null);
    await api.unlinkGoalFocus(goalId, linkedFocusId);
    await refreshFocus();
  }

  const accent = focus?.color ?? '#0f766e';

  return (
    <section className="grid gap-5 rounded-card border border-border bg-surface-raised p-5 shadow-card sm:p-6" style={{ borderLeftColor: accent, borderLeftWidth: '0.5rem' }}>
      <FocusHeader
        description={focus?.description ?? undefined}
        focus={focus}
        path={focusPath}
        onAddChild={() => setCreateChildModalOpen(true)}
        onAddGoal={() => setCreateGoalModalOpen(true)}
        onEdit={() => setEditModalOpen(true)}
      />

      {loading ? <LoadingState title="Loading Focus" description="Reading Focus details." /> : null}

      {error ? (
        <ErrorState title="Focus could not be loaded" description={error}>
          <Button variant="secondary" size="sm" onClick={() => void retry()}>
            Retry
          </Button>
        </ErrorState>
      ) : null}

      {!loading && !error && focus ? (
        <div className="grid gap-5">
          <FocusSummary focus={focus} statusSaving={statusSaving} onStatusChange={updateFocusStatus} />
          {actionError ? <p className="rounded-control bg-danger-muted p-3 text-sm text-danger">{actionError}</p> : null}

          <Modal
            open={editModalOpen}
            title="Edit Focus"
            description="Update generic Focus fields. Hierarchy changes stay out of this form."
            onClose={() => setEditModalOpen(false)}
            actions={
              <Button form="focus-edit-form" size="sm" type="submit">
                Save
              </Button>
            }
          >
            <FocusEditForm key={focus.id} formId="focus-edit-form" focus={focus} onSave={updateFocus} onSaved={() => setEditModalOpen(false)} />
          </Modal>

          <Modal open={createChildModalOpen} title="Add child Focus" description="Add the next nested unit of work under this Focus." onClose={() => setCreateChildModalOpen(false)}>
            <CreateChildFocusForm onCreate={createChild} onCreated={() => setCreateChildModalOpen(false)} />
          </Modal>

          <Modal open={createGoalModalOpen} title="Add Goal" description="Add an outcome for this Focus." onClose={() => setCreateGoalModalOpen(false)}>
            <CreateGoalForm onCreate={createGoal} onCreated={() => setCreateGoalModalOpen(false)} />
          </Modal>

          <section className="grid content-start gap-5">
            {focus.children.length > 0 ? (
              <div className="grid gap-4">
                {focus.children.map((child) => (
                  <ChildFocusCard key={child.id} focus={child} />
                ))}
              </div>
            ) : (
              <EmptyState title="No child Focuses yet" description="Add a child Focus to create the next layer of work.">
                <Button size="sm" onClick={() => setCreateChildModalOpen(true)}>
                  Add child Focus
                </Button>
              </EmptyState>
            )}

            <GoalsPanel focus={focus} goals={focus.goals} onSave={updateGoal} onDelete={deleteGoal} onLink={linkGoal} onUnlink={unlinkGoal} />
          </section>
        </div>
      ) : null}
    </section>
  );
}

type FocusHeaderProps = {
  focus: Focus | null;
  path: Focus[];
  description?: string;
  onEdit(): void;
  onAddChild(): void;
  onAddGoal(): void;
};

function FocusHeader({ focus, path, description, onEdit, onAddChild, onAddGoal }: FocusHeaderProps) {
  return (
    <header className="grid gap-5 lg:grid-cols-[1fr_12rem]">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-widest text-action">Focus</p>
        <FocusPath focus={focus} path={path} />
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{focus?.name ?? 'Focus details'}</h1>
        {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">{description}</p> : null}
      </div>
      {focus ? (
        <div className="grid content-start gap-2 justify-self-start lg:justify-self-end">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit Focus
          </Button>
          <Button size="sm" onClick={onAddChild}>
            Add child Focus
          </Button>
          <Button size="sm" onClick={onAddGoal}>
            Add Goal
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function FocusPath({ focus, path }: { focus: Focus | null; path: Focus[] }) {
  if (!focus) {
    return <p className="mt-2 text-sm text-text-muted">Loading path...</p>;
  }
  if (focus.parentId === null) {
    return (
      <Link className="mt-2 inline-flex text-sm font-medium text-action hover:text-action-hover" href="/">
        Back to Flows
      </Link>
    );
  }
  return (
    <nav className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted" aria-label="Focus path">
      <Link className="font-medium text-action hover:text-action-hover" href="/">
        Flows
      </Link>
      {path.map((item) => (
        <span className="inline-flex items-center gap-2" key={item.id}>
          <span className="text-text-subtle">/</span>
          <Link className="font-medium text-action hover:text-action-hover" href={`/focuses/${item.id}`}>
            {item.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}

async function buildFocusPath(api: FocusFlowAPI, focus: Focus) {
  const path: Focus[] = [];
  const seen = new Set([focus.id]);
  let current = focus;
  while (current.parentId && !seen.has(current.parentId) && path.length < 16) {
    const parent = await api.getFocus(current.parentId);
    path.unshift(parent);
    seen.add(parent.id);
    current = parent;
  }
  return path;
}

function errorMessage(cause: unknown) {
  if (cause instanceof AppAPIError) return cause.message;
  if (cause instanceof Error) return cause.message;
  return 'The request failed.';
}
