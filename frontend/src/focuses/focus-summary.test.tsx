import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Focus } from '@/api';
import { FocusSummary } from './focus-summary';

describe('FocusSummary', () => {
  it('renders compact Focus metadata without duplicated header fields', () => {
    const html = renderToStaticMarkup(<FocusSummary focus={focusFixture()} onStatusChange={() => undefined} />);

    expect(html).toContain('Planned');
    expect(html).not.toContain('Prepare notes and collect feedback.');
    expect(html).not.toContain('Feedback');
    expect(html).not.toContain('Color marker');
    expect(html).not.toContain('Created');
    expect(html).not.toContain('Updated');
    expect(html).not.toContain('Workato interview loop');
    expect(html).toContain('interview');
    expect(html).toContain('Status');
    expect(html).toContain('Child focuses');
    expect(html).toContain('Goals');
  });

  it('renders feedback when it exists', () => {
    const html = renderToStaticMarkup(<FocusSummary focus={focusFixture({ feedback: 'Follow up after the interview.' })} />);

    expect(html).toContain('Feedback');
    expect(html).toContain('Follow up after the interview.');
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