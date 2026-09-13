import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Focus } from '@/api';
import { FocusSummary } from './focus-summary';

describe('FocusSummary', () => {
  it('renders core Focus fields without generated API DTOs', () => {
    const html = renderToStaticMarkup(<FocusSummary focus={focusFixture()} />);

    expect(html).toContain('Workato interview loop');
    expect(html).toContain('Planned');
    expect(html).toContain('Prepare notes and collect feedback.');
    expect(html).toContain('No feedback yet.');
    expect(html).toContain('#175cd3');
    expect(html).toContain('interview');
  });
});

export function focusFixture(overrides: Partial<Focus> = {}): Focus {
  return {
    id: '018f6f1f-9a7b-7000-8000-000000000101',
    parentId: '018f6f1f-9a7b-7000-8000-000000000100',
    name: 'Workato interview loop',
    status: 'planned',
    tags: ['interview'],
    description: 'Prepare notes and collect feedback.',
    feedback: null,
    color: '#175cd3',
    goals: [],
    children: [],
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: '2026-09-13T12:00:00Z',
    finishedAt: null,
    ...overrides,
  };
}

