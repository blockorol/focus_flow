'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppAPIError, type CreateFlowInput, type Focus, type FocusPage } from '@/api';
import { getBrowserAPI } from '@/api/browser';
import { Button, EmptyState, ErrorState, LoadingState, Modal } from '@/ui';
import { CreateFlowForm } from './create-flow-form';
import { FlowCard } from './flow-card';

const pageSize = 10;

export function FlowDashboard() {
  const [flows, setFlows] = useState<Focus[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadFlows = useCallback(async (cursor?: string) => {
    const api = getBrowserAPI();
    const page = await api.listFlows({ limit: pageSize, cursor, include: ['children', 'goals'], depth: 1 });
    applyPage(page, Boolean(cursor));
  }, []);

  function applyPage(page: FocusPage, append: boolean) {
    setFlows((current) => (append ? [...current, ...page.items] : page.items));
    setNextCursor(page.nextCursor);
    setHasMore(page.hasMore);
  }

  useEffect(() => {
    let active = true;
    loadFlows()
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
  }, [loadFlows]);

  async function createFlow(input: CreateFlowInput) {
    const api = getBrowserAPI();
    await api.createFlow(input);
    const page = await api.listFlows({ limit: pageSize, include: ['children', 'goals'], depth: 1 });
    applyPage(page, false);
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      await loadFlows(nextCursor);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-5 rounded-card border border-border bg-surface-raised p-5 shadow-card sm:p-6 lg:grid-cols-[1fr_12rem]">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-widest text-action">Flows</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Root Focuses for the work that matters.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Create root Focuses, then break them into child Focuses and Goals.</p>
        </div>
        <div className="grid content-start gap-2 justify-self-start lg:justify-self-end">
          <Button onClick={() => setCreateModalOpen(true)}>
            Create Flow
          </Button>
        </div>
      </header>

      <Modal open={createModalOpen} title="Create Flow" description="Start from one root Focus and add deeper structure later." onClose={() => setCreateModalOpen(false)}>
        <CreateFlowForm onCreate={createFlow} onCreated={() => setCreateModalOpen(false)} />
      </Modal>

      <div className="grid gap-5">
        <section className="grid content-start gap-4">
          {loading ? <LoadingState title="Loading Flows" description="Reading your workspace data." /> : null}

          {error ? (
            <ErrorState title="Flows could not be loaded" description={error}>
              <Button variant="secondary" size="sm" onClick={() => void loadFlows()}>
                Retry
              </Button>
            </ErrorState>
          ) : null}

          {!loading && !error && flows.length === 0 ? (
            <EmptyState title="No Flows yet" description="Create your first Flow to start grouping Focuses.">
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                Create Flow
              </Button>
            </EmptyState>
          ) : null}

          {!loading && !error && flows.length > 0 ? (
            <div className="grid gap-4">
              {flows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} />
              ))}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function errorMessage(cause: unknown) {
  if (cause instanceof AppAPIError) return cause.message;
  if (cause instanceof Error) return cause.message;
  return 'The request failed.';
}
