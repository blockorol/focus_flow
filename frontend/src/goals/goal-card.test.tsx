import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Focus, Goal } from '@/api';
import { GoalCard } from './goal-card';

describe('GoalCard', () => {
  it('renders the collapsed one-line Goal row by default', () => {
    const child = focusFixture();
    const html = renderToStaticMarkup(
      <GoalCard
        goal={goalFixture({ linkedFocusIds: [child.id], progress: { linkedCount: 1, terminalCount: 0, doneCount: 0, statusCounts: { active: 1 } } })}
        linkCandidates={[child]}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onLink={async () => undefined}
        onUnlink={async () => undefined}
      />,
    );

    expect(html).toContain('Finish the strongest application path.');
    expect(html).toContain('primary');
    expect(html).toContain('Goal progress by linked Focus status');
    expect(html).not.toContain('Edit');
    expect(html).not.toContain('Delete');
    expect(html).not.toContain('Derived from linked Focuses');
    expect(html).not.toContain(`/focuses/${child.id}`);
    expect(html).not.toContain('Linked Focuses');
    expect(html).not.toContain('Unlink');
  });

  it('renders a manual status override badge in the collapsed row', () => {
    const html = renderToStaticMarkup(
      <GoalCard
        goal={goalFixture({ statusOverride: 'done' })}
        linkCandidates={[]}
        onEdit={() => undefined}
        onDelete={async () => undefined}
        onLink={async () => undefined}
        onUnlink={async () => undefined}
      />,
    );

    expect(html).toContain('Done');
    expect(html).not.toContain('Manual status: Done');
  });
});

export function goalFixture(overrides: Partial<Goal> = {}): Goal {
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
