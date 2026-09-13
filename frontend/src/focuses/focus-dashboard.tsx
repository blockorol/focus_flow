'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppAPIError, type CreateFocusInput, type CreateGoalInput, type Focus, type UpdateFocusInput, type UpdateGoalInput } from '@/api';
import { getBrowserAPI } from '@/api/browser';
import { PageHeader } from '@/app-shell';
import { GoalsPanel } from '@/goals';
import { Button, EmptyState, ErrorState, LoadingState } from '@/ui';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFocus = useCallback(async () => {
    const api = getBrowserAPI();
    const nextFocus = await api.getFocus(focusId, { include: ['children', 'goals'], depth: 1 });
    setFocus(nextFocus);
    return nextFocus;
  }, [focusId]);

  useEffect(() => {
    let active = true;
    getBrowserAPI()
      .getFocus(focusId, { include: ['children', 'goals'], depth: 1 })
      .then((nextFocus) => {
        if (!active) return;
        setFocus(nextFocus);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [focusId]);

  async function retry() {
    setLoading(true);
    setError(null);
    try {
      await loadFocus();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  async function createChild(input: CreateChildFocusInput) {
    const api = getBrowserAPI();
    await api.createFocus({ ...input, parentId: focusId });
    await loadFocus();
  }

  async function updateFocus(input: UpdateFocusInput) {
    const api = getBrowserAPI();
    const updated = await api.updateFocus(focusId, input);
    const reloaded = await loadFocus();
    return { ...updated, children: reloaded.children, goals: reloaded.goals };
  }

  async function createGoal(input: CreateGoalInput) {
    const api = getBrowserAPI();
    await api.createGoal(focusId, input);
    await loadFocus();
  }

  async function updateGoal(goalId: string, input: UpdateGoalInput) {
    const api = getBrowserAPI();
    await api.updateGoal(goalId, input);
    await loadFocus();
  }

  async function deleteGoal(goalId: string) {
    const api = getBrowserAPI();
    await api.deleteGoal(goalId);
    await loadFocus();
  }

  async function linkGoal(goalId: string, linkedFocusId: string) {
    const api = getBrowserAPI();
    await api.linkGoalFocus(goalId, { focusId: linkedFocusId });
    await loadFocus();
  }

  async function unlinkGoal(goalId: string, linkedFocusId: string) {
    const api = getBrowserAPI();
    await api.unlinkGoalFocus(goalId, linkedFocusId);
    await loadFocus();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Focus"
        title={focus?.name ?? 'Focus details'}
        description="View one Focus aggregate, its current fields, and direct child Focuses."
        actions={
          <Link className="text-sm font-medium text-action hover:text-action-hover" href="/">
            Back to Flows
          </Link>
        }
      />

      {loading ? <LoadingState title="Loading Focus" description="Reading mock Focus details." /> : null}

      {error ? (
        <ErrorState title="Focus could not be loaded" description={error}>
          <Button variant="secondary" size="sm" onClick={() => void retry()}>
            Retry
          </Button>
        </ErrorState>
      ) : null}

      {!loading && !error && focus ? (
        <div className="grid gap-5">
          <FocusSummary focus={focus} />

          <div className="grid gap-5 xl:grid-cols-[minmax(280px,380px)_1fr]">
            <div className="grid content-start gap-5">
              <FocusEditForm key={focus.id} focus={focus} onSave={updateFocus} />
              <CreateChildFocusForm onCreate={createChild} />
            </div>

            <section className="grid content-start gap-5">
              <div className="grid gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">Child Focuses</h2>
                {focus.children.length > 0 ? (
                  <div className="grid gap-4">
                    {focus.children.map((child) => (
                      <ChildFocusCard key={child.id} focus={child} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No child Focuses yet" description="Create a child Focus to add the next layer of work." />
                )}
              </div>

              <GoalsPanel focus={focus} goals={focus.goals} onCreate={createGoal} onSave={updateGoal} onDelete={deleteGoal} onLink={linkGoal} onUnlink={unlinkGoal} />
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function errorMessage(cause: unknown) {
  if (cause instanceof AppAPIError) return cause.message;
  if (cause instanceof Error) return cause.message;
  return 'The request failed.';
}
