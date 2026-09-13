import { describe, expect, it } from 'vitest';
import { createFocusToAPI, focusFromAPI, goalFromAPI, updateFocusToAPI } from './mappers';

describe('frontend API mappers', () => {
  it('maps API Focus DTOs into frontend models with cloned nested arrays', () => {
    const apiFocus = {
      id: '018f6f1f-9a7b-7000-8000-000000000100',
      parentId: null,
      name: 'Job Search',
      status: 'active' as const,
      tags: ['career'],
      description: 'Track interviews.',
      feedback: null,
      color: '#0f766e',
      goals: [
        {
          id: '018f6f1f-9a7b-7000-8000-000000000200',
          ownerFocusId: '018f6f1f-9a7b-7000-8000-000000000100',
          type: 'primary' as const,
          description: 'Finish loop.',
          statusOverride: null,
          linkedFocusIds: ['018f6f1f-9a7b-7000-8000-000000000101'],
          progress: { linkedCount: 1, terminalCount: 0, doneCount: 0, statusCounts: { planned: 1 } },
          createdAt: '2026-09-13T12:00:00Z',
          updatedAt: '2026-09-13T12:00:00Z',
          finishedAt: null,
        },
      ],
      children: [],
      createdAt: '2026-09-13T12:00:00Z',
      updatedAt: '2026-09-13T12:00:00Z',
      finishedAt: null,
    };

    const focus = focusFromAPI(apiFocus);

    expect(focus.name).toBe('Job Search');
    expect(focus.goals[0]?.progress.statusCounts.planned).toBe(1);
    expect(focus.tags).not.toBe(apiFocus.tags);
    expect(focus.goals[0]?.linkedFocusIds).not.toBe(apiFocus.goals[0]?.linkedFocusIds);
  });

  it('filters unknown API status-count keys out of frontend goal progress', () => {
    const goal = goalFromAPI({
      id: '018f6f1f-9a7b-7000-8000-000000000200',
      ownerFocusId: '018f6f1f-9a7b-7000-8000-000000000100',
      type: 'primary',
      description: 'Finish loop.',
      statusOverride: null,
      linkedFocusIds: [],
      progress: { linkedCount: 1, terminalCount: 0, doneCount: 0, statusCounts: { planned: 1, unknown: 9 } },
      createdAt: '2026-09-13T12:00:00Z',
      updatedAt: '2026-09-13T12:00:00Z',
      finishedAt: null,
    });

    expect(goal.progress.statusCounts).toEqual({ planned: 1 });
  });

  it('maps frontend inputs into API request DTOs only at the boundary', () => {
    expect(createFocusToAPI({ parentId: null, name: 'New focus', tags: ['next'] })).toEqual({ parentId: null, name: 'New focus', tags: ['next'] });
    expect(updateFocusToAPI({ clearFields: ['description'], status: 'done' })).toEqual({ clearFields: ['description'], status: 'done' });
  });
});