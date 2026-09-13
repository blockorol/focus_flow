import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Focus, Goal } from '@/api';
import { GoalCard } from './goal-card';

describe('GoalCard', () => {
  it('renders goal progress and link controls', () => {
    const child = focusFixture();
    const html = renderToStaticMarkup(
      <GoalCard
        goal={goalFixture({ linkedFocusIds: [child.id], progress: { linkedCount: 1, terminalCount: 0, doneCount: 0, statusCounts: { active: 1 } } })}
        linkCandidates={[child]}
        onSave={async () => undefined}
        onDelete={async () => undefined}
        onLink={async () => undefined}
        onUnlink={async () => undefined}
      />,
    );

    expect(html).toContain('Finish the strongest application path.');
    expect(html).toContain('Derived from linked Focuses');
    expect(html).toContain('Unlink Workato interview loop');
    expect(html).toContain('Edit');
    expect(html).toContain('Delete');
  });

  it('renders manual status override copy', () => {
    const html = renderToStaticMarkup(
      <GoalCard
        goal={goalFixture({ statusOverride: 'done' })}
        linkCandidates={[]}
        onSave={async () => undefined}
        onDelete={async () => undefined}
        onLink={async () => undefined}
        onUnlink={async () => undefined}
      />,
    );

    expect(html).toContain('Manual status: Done');
  });
});

function goalFixture(overrides: Partial<Goal> = {}): Goal {
  return {
    id: '018f6f1f-9a7b-7000-8000-000000000200',
    ownerFocusId: '018f6f1f-9a7b-7000-8000-000000000100',
    type: 'primary',
    description: 'Finish the strongest application path.',
    statusOverride: null,
    linkedFocusIds: [],
    progress: { linkedCount: 0, terminalCount: 0, doneCount: 0, statusCounts: {} },
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: '2026-09-13T12:00:00Z',
    finishedAt: null,
    ...overrides,
  };
}

function focusFixture(overrides: Partial<Focus> = {}): Focus {
  return {
    id: '018f6f1f-9a7b-7000-8000-000000000101',
    parentId: '018f6f1f-9a7b-7000-8000-000000000100',
    name: 'Workato interview loop',
    status: 'active',
    tags: ['interview'],
    description: null,
    feedback: null,
    color: null,
    goals: [],
    children: [],
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: '2026-09-13T12:00:00Z',
    finishedAt: null,
    ...overrides,
  };
}

