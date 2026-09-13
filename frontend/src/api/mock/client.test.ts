import { describe, expect, it } from 'vitest';
import { MockFocusFlowAPI } from './client';

const rootID = '018f6f1f-9a7b-7000-8000-000000000100';
const childID = '018f6f1f-9a7b-7000-8000-000000000101';

describe('MockFocusFlowAPI', () => {
  it('requires a mock session for protected data', async () => {
    const api = new MockFocusFlowAPI();
    await expect(api.listFlows()).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
  });

  it('supports the happy path for flows, focuses, and goals', async () => {
    const api = new MockFocusFlowAPI();
    await api.login({ username: 'local', password: 'secret' });

    const flow = await api.createFlow({ name: 'Learning Go', tags: ['learning'] });
    expect(flow.parentId).toBeNull();

    const child = await api.createFocus({ parentId: flow.id, name: 'Read pgx docs', status: 'active' });
    expect(child.parentId).toBe(flow.id);

    const focus = await api.getFocus(flow.id, { include: ['children'], depth: 1 });
    expect(focus.children.map((item) => item.id)).toContain(child.id);

    const updated = await api.updateFocus(child.id, { status: 'done' });
    expect(updated.finishedAt).not.toBeNull();

    const goal = await api.createGoal(flow.id, { type: 'primary', description: 'Finish backend review', linkedFocusIds: [child.id] });
    expect(goal.progress.doneCount).toBe(1);

    const linked = await api.linkGoalFocus(goal.id, { focusId: rootID });
    expect(linked.linkedFocusIds).toContain(rootID);

    const unlinked = await api.unlinkGoalFocus(goal.id, rootID);
    expect(unlinked.linkedFocusIds).not.toContain(rootID);
  });

  it('supports cursor pagination', async () => {
    const api = new MockFocusFlowAPI();
    await api.login({ username: 'local', password: 'secret' });
    await api.createFlow({ name: 'Second flow' });
    const first = await api.listFlows({ limit: 1 });
    expect(first.count).toBe(1);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).not.toBeNull();
    const second = await api.listFlows({ limit: 1, cursor: first.nextCursor ?? undefined });
    expect(second.count).toBe(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('normalizes not-found and conflict paths', async () => {
    const api = new MockFocusFlowAPI();
    await api.login({ username: 'local', password: 'secret' });
    await expect(api.createFocus({ parentId: '018f6f1f-9a7b-7000-8000-999999999999', name: 'Missing parent' })).rejects.toMatchObject({ kind: 'not_found', status: 404 });
    await expect(api.updateFocus(rootID, { parentId: childID })).rejects.toMatchObject({ kind: 'conflict', status: 409 });
  });
});
