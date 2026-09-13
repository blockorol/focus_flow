'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppAPIError, type CreateFlowInput, type Focus, type FocusPage } from '@/api';
import { getBrowserAPI } from '@/api/browser';
import { PageHeader } from '@/app-shell';
import { Button, EmptyState, ErrorState, LoadingState } from '@/ui';
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
      <PageHeader
        eyebrow="Flows"
        title="Root Focuses for the work that matters."
        description="Mock mode lists root Focuses as Flows and lets you create the next one before persistence is connected."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(280px,380px)_1fr]">
        <CreateFlowForm onCreate={createFlow} />

        <section className="grid content-start gap-4">
          {loading ? <LoadingState title="Loading Flows" description="Reading mock workspace data." /> : null}

          {error ? (
            <ErrorState title="Flows could not be loaded" description={error}>
              <Button variant="secondary" size="sm" onClick={() => void loadFlows()}>
                Retry
              </Button>
            </ErrorState>
          ) : null}

          {!loading && !error && flows.length === 0 ? <EmptyState title="No Flows yet" description="Create your first Flow to start grouping Focuses." /> : null}

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
