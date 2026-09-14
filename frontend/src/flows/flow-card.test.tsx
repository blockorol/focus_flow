import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Focus } from '@/api';
import { FlowCard } from './flow-card';

describe('FlowCard', () => {
  it('renders a root Focus as a Flow card', () => {
    const html = renderToStaticMarkup(<FlowCard flow={flowFixture()} />);

    expect(html).toContain('Job Search');
    expect(html).toContain('Active');
    expect(html).toContain('Track companies, interviews, and next actions.');
    expect(html).toContain('career');
    expect(html).toContain('Child focuses');
    expect(html).toContain('Goals');
    expect(html).toContain(`/focuses/${flowFixture().id}`);
    expect(html).toContain('Open');
    expect(html).not.toContain('Updated');
  });

  it('renders fallback copy for an empty description', () => {
    const flow = flowFixture({ description: null });
    const html = renderToStaticMarkup(<FlowCard flow={flow} />);

    expect(html).toContain('No description yet.');
  });
});

function flowFixture(overrides: Partial<Focus> = {}): Focus {
  return {
    id: '018f6f1f-9a7b-7000-8000-000000000100',
    parentId: null,
    name: 'Job Search',
    status: 'active',
    tags: ['career'],
    description: 'Track companies, interviews, and next actions.',
    feedback: null,
    color: '#0f766e',
    goals: [
      {
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
      },
    ],
    children: [
      {
        id: '018f6f1f-9a7b-7000-8000-000000000101',
        parentId: '018f6f1f-9a7b-7000-8000-000000000100',
        name: 'Workato interview loop',
        status: 'planned',
        tags: ['interview'],
        description: null,
        feedback: null,
        color: null,
        goals: [],
        children: [],
        createdAt: '2026-09-13T12:00:00Z',
        updatedAt: '2026-09-13T12:00:00Z',
        finishedAt: null,
      },
    ],
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: '2026-09-13T12:00:00Z',
    finishedAt: null,
    ...overrides,
  };
}
