import { AppAPIError } from '../errors';
import type { CreateFlowInput, CreateFocusInput, CreateGoalInput, Focus, FocusFlowAPI, FocusQuery, Goal, LinkGoalFocusInput, LoginInput, PageRequest, Session, UUID, UpdateFocusInput, UpdateGoalInput } from '../types';

const user = { id: '018f6f1f-9a7b-7000-8000-000000000001', username: 'local' };
const seedFlowID = '018f6f1f-9a7b-7000-8000-000000000100';
const seedChildID = '018f6f1f-9a7b-7000-8000-000000000101';
const seedGoalID = '018f6f1f-9a7b-7000-8000-000000000200';
const now = '2026-09-13T12:00:00Z';

type MockState = {
  session: Session | null;
  focuses: Map<UUID, Focus>;
  goals: Map<UUID, Goal>;
  nextFocus: number;
  nextGoal: number;
};

export class MockFocusFlowAPI implements FocusFlowAPI {
  private readonly state: MockState;

  constructor(state = createInitialState()) {
    this.state = state;
  }

  async getHealth() {
    return { status: 'ok' as const };
  }

  async login(input: LoginInput) {
    void input;
    this.state.session = mockSession();
    return this.state.session;
  }

  async logout() {
    this.state.session = null;
  }

  async getCurrentSession() {
    return this.requireSession();
  }

  async refreshSession() {
    this.state.session = mockSession();
    return this.state.session;
  }

  async listFlows(query: FocusQuery = {}) {
    this.requireSession();
    const flows = [...this.state.focuses.values()].filter((focus) => focus.parentId === null).map((focus) => this.withIncludes(focus, query));
    return pageByID(flows, query);
  }

  async createFlow(input: CreateFlowInput) {
    this.requireSession();
    const focus = this.createFocusRecord({ ...input, parentId: null });
    this.state.focuses.set(focus.id, focus);
    return cloneFocus(focus);
  }

  async createFocus(input: CreateFocusInput) {
    this.requireSession();
    if (input.parentId && !this.state.focuses.has(input.parentId)) {
      throw new AppAPIError('not_found', 'The requested resource was not found.', { status: 404 });
    }
    const focus = this.createFocusRecord(input);
    this.state.focuses.set(focus.id, focus);
    return cloneFocus(focus);
  }

  async getFocus(id: UUID, query: Omit<FocusQuery, 'limit' | 'cursor'> = {}) {
    this.requireSession();
    const focus = this.getFocusRecord(id);
    return this.withIncludes(focus, query);
  }

  async updateFocus(id: UUID, input: UpdateFocusInput) {
    this.requireSession();
    const current = this.getFocusRecord(id);
    const next = cloneFocus(current);
    if (input.clearFields?.includes('parentId')) next.parentId = null;
    if (input.clearFields?.includes('description')) next.description = null;
    if (input.clearFields?.includes('feedback')) next.feedback = null;
    if (input.clearFields?.includes('color')) next.color = null;
    if (input.parentId !== undefined) {
      if (!this.state.focuses.has(input.parentId)) throw new AppAPIError('not_found', 'The requested resource was not found.', { status: 404 });
      if (input.parentId === id || this.isDescendant(input.parentId, id)) {
        throw new AppAPIError('conflict', 'The requested change conflicts with the current resource state.', { status: 409 });
      }
      next.parentId = input.parentId;
    }
    if (input.name !== undefined) next.name = input.name;
    if (input.status !== undefined) next.status = input.status;
    if (input.tags !== undefined) next.tags = [...input.tags];
    if (input.description !== undefined) next.description = input.description;
    if (input.feedback !== undefined) next.feedback = input.feedback;
    if (input.color !== undefined) next.color = input.color;
    next.updatedAt = now;
    next.finishedAt = next.status === 'done' || next.status === 'cancelled' ? now : null;
    this.state.focuses.set(id, next);
    return cloneFocus(next);
  }

  async deleteFocus(id: UUID) {
    this.requireSession();
    this.getFocusRecord(id);
    for (const focusID of this.descendantIDs(id)) this.state.focuses.delete(focusID);
    this.state.focuses.delete(id);
    for (const [goalID, goal] of this.state.goals) {
      if (goal.ownerFocusId === id) {
        this.state.goals.delete(goalID);
      } else {
        goal.linkedFocusIds = goal.linkedFocusIds.filter((focusID) => focusID !== id);
        goal.progress = progressFor(goal, this.state.focuses);
      }
    }
  }

  async listFocusChildren(id: UUID, query: FocusQuery = {}) {
    this.requireSession();
    this.getFocusRecord(id);
    const children = [...this.state.focuses.values()].filter((focus) => focus.parentId === id).map((focus) => this.withIncludes(focus, query));
    return pageByID(children, query);
  }

  async listFocusGoals(id: UUID, query: PageRequest = {}) {
    this.requireSession();
    this.getFocusRecord(id);
    const goals = [...this.state.goals.values()].filter((goal) => goal.ownerFocusId === id).map((goal) => this.withProgress(goal));
    return pageByID(goals, query);
  }

  async createGoal(focusId: UUID, input: CreateGoalInput) {
    this.requireSession();
    this.getFocusRecord(focusId);
    for (const linkedFocusID of input.linkedFocusIds ?? []) this.getFocusRecord(linkedFocusID);
    const goal: Goal = {
      id: nextUUID('300', this.state.nextGoal++),
      ownerFocusId: focusId,
      type: input.type,
      description: input.description,
      statusOverride: input.statusOverride ?? null,
      linkedFocusIds: [...(input.linkedFocusIds ?? [])],
      progress: { linkedCount: 0, terminalCount: 0, doneCount: 0, statusCounts: {} },
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
    };
    goal.progress = progressFor(goal, this.state.focuses);
    this.state.goals.set(goal.id, goal);
    return cloneGoal(goal);
  }

  async getGoal(id: UUID) {
    this.requireSession();
    return this.withProgress(this.getGoalRecord(id));
  }

  async updateGoal(id: UUID, input: UpdateGoalInput) {
    this.requireSession();
    const current = this.getGoalRecord(id);
    const next = cloneGoal(current);
    if (input.clearFields?.includes('statusOverride')) next.statusOverride = null;
    if (input.type !== undefined) next.type = input.type;
    if (input.description !== undefined) next.description = input.description;
    if (input.statusOverride !== undefined) next.statusOverride = input.statusOverride;
    if (input.linkedFocusIds !== undefined) {
      for (const focusID of input.linkedFocusIds) this.getFocusRecord(focusID);
      next.linkedFocusIds = [...input.linkedFocusIds];
    }
    next.updatedAt = now;
    next.progress = progressFor(next, this.state.focuses);
    this.state.goals.set(id, next);
    return cloneGoal(next);
  }

  async deleteGoal(id: UUID) {
    this.requireSession();
    this.getGoalRecord(id);
    this.state.goals.delete(id);
  }

  async linkGoalFocus(goalId: UUID, input: LinkGoalFocusInput) {
    this.requireSession();
    this.getFocusRecord(input.focusId);
    const goal = cloneGoal(this.getGoalRecord(goalId));
    if (!goal.linkedFocusIds.includes(input.focusId)) goal.linkedFocusIds.push(input.focusId);
    goal.updatedAt = now;
    goal.progress = progressFor(goal, this.state.focuses);
    this.state.goals.set(goalId, goal);
    return cloneGoal(goal);
  }

  async unlinkGoalFocus(goalId: UUID, focusId: UUID) {
    this.requireSession();
    const goal = cloneGoal(this.getGoalRecord(goalId));
    goal.linkedFocusIds = goal.linkedFocusIds.filter((id) => id !== focusId);
    goal.updatedAt = now;
    goal.progress = progressFor(goal, this.state.focuses);
    this.state.goals.set(goalId, goal);
    return cloneGoal(goal);
  }

  private requireSession() {
    if (!this.state.session) throw new AppAPIError('unauthorized', 'Authentication is required.', { status: 401 });
    return this.state.session;
  }

  private getFocusRecord(id: UUID) {
    const focus = this.state.focuses.get(id);
    if (!focus) throw new AppAPIError('not_found', 'The requested resource was not found.', { status: 404 });
    return focus;
  }

  private getGoalRecord(id: UUID) {
    const goal = this.state.goals.get(id);
    if (!goal) throw new AppAPIError('not_found', 'The requested resource was not found.', { status: 404 });
    return goal;
  }

  private createFocusRecord(input: CreateFocusInput): Focus {
    return {
      id: nextUUID('100', this.state.nextFocus++),
      parentId: input.parentId ?? null,
      name: input.name,
      status: input.status ?? 'planned',
      tags: [...(input.tags ?? [])],
      description: input.description ?? null,
      feedback: input.feedback ?? null,
      color: input.color ?? null,
      goals: [],
      children: [],
      createdAt: now,
      updatedAt: now,
      finishedAt: input.status === 'done' || input.status === 'cancelled' ? now : null,
    };
  }

  private withIncludes(focus: Focus, query: Omit<FocusQuery, 'limit' | 'cursor'>): Focus {
    const result = cloneFocus(focus);
    if (query.include?.includes('goals')) {
      result.goals = [...this.state.goals.values()].filter((goal) => goal.ownerFocusId === focus.id).map((goal) => this.withProgress(goal));
    }
    if (query.include?.includes('children') && (query.depth ?? 0) > 0) {
      result.children = [...this.state.focuses.values()]
        .filter((child) => child.parentId === focus.id)
        .map((child) => this.withIncludes(child, { ...query, depth: (query.depth ?? 0) - 1 }));
    }
    return result;
  }

  private withProgress(goal: Goal) {
    const next = cloneGoal(goal);
    next.progress = progressFor(next, this.state.focuses);
    return next;
  }

  private isDescendant(candidateID: UUID, ancestorID: UUID): boolean {
    const candidate = this.state.focuses.get(candidateID);
    if (!candidate?.parentId) return false;
    if (candidate.parentId === ancestorID) return true;
    return this.isDescendant(candidate.parentId, ancestorID);
  }

  private descendantIDs(parentID: UUID): UUID[] {
    const direct = [...this.state.focuses.values()].filter((focus) => focus.parentId === parentID).map((focus) => focus.id);
    return direct.flatMap((id) => [id, ...this.descendantIDs(id)]);
  }
}

function createInitialState(): MockState {
  const focuses = new Map<UUID, Focus>();
  const goals = new Map<UUID, Goal>();
  const root: Focus = {
    id: seedFlowID,
    parentId: null,
    name: 'Job Search',
    status: 'active',
    tags: ['career'],
    description: 'Track companies, interviews, and next actions.',
    feedback: null,
    color: '#0f766e',
    goals: [],
    children: [],
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  };
  const child: Focus = {
    id: seedChildID,
    parentId: seedFlowID,
    name: 'Workato interview loop',
    status: 'planned',
    tags: ['interview'],
    description: 'Prepare notes and collect feedback after each step.',
    feedback: null,
    color: '#175cd3',
    goals: [],
    children: [],
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  };
  const goal: Goal = {
    id: seedGoalID,
    ownerFocusId: seedFlowID,
    type: 'primary',
    description: 'Finish the strongest application path.',
    statusOverride: null,
    linkedFocusIds: [seedChildID],
    progress: { linkedCount: 0, terminalCount: 0, doneCount: 0, statusCounts: {} },
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  };
  focuses.set(root.id, root);
  focuses.set(child.id, child);
  goal.progress = progressFor(goal, focuses);
  goals.set(goal.id, goal);
  return { session: null, focuses, goals, nextFocus: 2, nextGoal: 1 };
}

function mockSession(): Session {
  return { user, expiresAt: '2026-09-13T14:00:00Z' };
}

type MockPage<T> = {
  items: T[];
  count: number;
  nextCursor: string | null;
  hasMore: boolean;
};

function pageByID<T extends { id: UUID }>(items: T[], request: PageRequest): MockPage<T> {
  const sorted = [...items].sort((left, right) => left.id.localeCompare(right.id));
  const limit = request.limit && request.limit > 0 && request.limit <= 100 ? request.limit : 50;
  const start = request.cursor ? sorted.findIndex((item) => item.id === request.cursor) + 1 : 0;
  const safeStart = start > 0 ? start : 0;
  const pageItems = sorted.slice(safeStart, safeStart + limit);
  const hasMore = safeStart + limit < sorted.length;
  const nextCursor = hasMore ? pageItems.at(-1)?.id ?? null : null;
  return { items: pageItems, count: pageItems.length, nextCursor, hasMore };
}

function progressFor(goal: Goal, focuses: Map<UUID, Focus>) {
  const statusCounts: Record<string, number> = {};
  let linkedCount = 0;
  let terminalCount = 0;
  let doneCount = 0;
  for (const focusID of goal.linkedFocusIds) {
    const focus = focuses.get(focusID);
    if (!focus) continue;
    linkedCount += 1;
    statusCounts[focus.status] = (statusCounts[focus.status] ?? 0) + 1;
    if (focus.status === 'done' || focus.status === 'cancelled') terminalCount += 1;
    if (focus.status === 'done') doneCount += 1;
  }
  return { linkedCount, terminalCount, doneCount, statusCounts };
}

function cloneFocus(focus: Focus): Focus {
  return {
    ...focus,
    tags: [...focus.tags],
    goals: focus.goals.map(cloneGoal),
    children: focus.children.map(cloneFocus),
  };
}

function cloneGoal(goal: Goal): Goal {
  return {
    ...goal,
    linkedFocusIds: [...goal.linkedFocusIds],
    progress: { ...goal.progress, statusCounts: { ...goal.progress.statusCounts } },
  };
}

function nextUUID(section: string, value: number): UUID {
  return `018f6f1f-9a7b-7000-8000-${section}${value.toString().padStart(9, '0')}`;
}
