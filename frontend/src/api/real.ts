import createClient, { type Client } from 'openapi-fetch';
import type { paths } from './generated/schema';
import { assertData, apiErrorFromResponse } from './errors';
import { createFlowToAPI, createFocusToAPI, createGoalToAPI, focusFromAPI, goalFromAPI, healthFromAPI, linkGoalFocusToAPI, loginToAPI, sessionFromAPI, updateFocusToAPI, updateGoalToAPI } from './mappers';
import type { CreateFlowInput, CreateFocusInput, CreateGoalInput, Focus, FocusFlowAPI, FocusPage, FocusQuery, Goal, GoalPage, HealthStatus, LinkGoalFocusInput, LoginInput, PageRequest, Session, UUID, UpdateFocusInput, UpdateGoalInput } from './types';

export function createOpenAPIClient(
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
) {
  return createClient<paths>({ baseUrl, credentials: 'include', fetch: fetchImplementation });
}

export class RealFocusFlowAPI implements FocusFlowAPI {
  constructor(private readonly client: Client<paths> = createOpenAPIClient()) {}

  async getHealth(): Promise<HealthStatus> {
    return healthFromAPI(assertData(await this.client.GET('/v1/health')));
  }

  async login(input: LoginInput): Promise<Session> {
    const result = await this.client.POST('/v1/auth/login', { body: loginToAPI(input) });
    return sessionFromAPI(assertData(result).session);
  }

  async logout() {
    const result = await this.client.POST('/v1/auth/logout');
    if (!result.response.ok) throw apiErrorFromResponse(result.response.status, result.error);
  }

  async getCurrentSession(): Promise<Session> {
    const result = await this.client.GET('/v1/auth/me');
    return sessionFromAPI(assertData(result).session);
  }

  async refreshSession(): Promise<Session> {
    const result = await this.client.POST('/v1/auth/refresh');
    return sessionFromAPI(assertData(result).session);
  }

  async listFlows(query: FocusQuery = {}): Promise<FocusPage> {
    const page = assertData(await this.client.GET('/v1/flows', { params: { query: toFocusQueryParams(query) } }));
    return { ...page, items: page.items.map(focusFromAPI) };
  }

  async createFlow(input: CreateFlowInput): Promise<Focus> {
    const result = await this.client.POST('/v1/flows', { body: createFlowToAPI(input) });
    return focusFromAPI(assertData(result).focus);
  }

  async createFocus(input: CreateFocusInput): Promise<Focus> {
    const result = await this.client.POST('/v1/focuses', { body: createFocusToAPI(input) });
    return focusFromAPI(assertData(result).focus);
  }

  async getFocus(id: UUID, query: Omit<FocusQuery, 'limit' | 'cursor'> = {}): Promise<Focus> {
    const result = await this.client.GET('/v1/focuses/{id}', { params: { path: { id }, query: toFocusQueryParams(query) } });
    return focusFromAPI(assertData(result).focus);
  }

  async updateFocus(id: UUID, input: UpdateFocusInput): Promise<Focus> {
    const result = await this.client.PATCH('/v1/focuses/{id}', { params: { path: { id } }, body: updateFocusToAPI(input) });
    return focusFromAPI(assertData(result).focus);
  }

  async deleteFocus(id: UUID): Promise<void> {
    const result = await this.client.DELETE('/v1/focuses/{id}', { params: { path: { id } } });
    if (!result.response.ok) throw apiErrorFromResponse(result.response.status, result.error);
  }

  async listFocusChildren(id: UUID, query: FocusQuery = {}): Promise<FocusPage> {
    const page = assertData(await this.client.GET('/v1/focuses/{id}/children', { params: { path: { id }, query: toFocusQueryParams(query) } }));
    return { ...page, items: page.items.map(focusFromAPI) };
  }

  async listFocusGoals(id: UUID, query: PageRequest = {}): Promise<GoalPage> {
    const page = assertData(await this.client.GET('/v1/focuses/{id}/goals', { params: { path: { id }, query } }));
    return { ...page, items: page.items.map(goalFromAPI) };
  }

  async createGoal(focusId: UUID, input: CreateGoalInput): Promise<Goal> {
    const result = await this.client.POST('/v1/focuses/{id}/goals', { params: { path: { id: focusId } }, body: createGoalToAPI(input) });
    return goalFromAPI(assertData(result).goal);
  }

  async getGoal(id: UUID): Promise<Goal> {
    const result = await this.client.GET('/v1/goals/{id}', { params: { path: { id } } });
    return goalFromAPI(assertData(result).goal);
  }

  async updateGoal(id: UUID, input: UpdateGoalInput): Promise<Goal> {
    const result = await this.client.PATCH('/v1/goals/{id}', { params: { path: { id } }, body: updateGoalToAPI(input) });
    return goalFromAPI(assertData(result).goal);
  }

  async deleteGoal(id: UUID): Promise<void> {
    const result = await this.client.DELETE('/v1/goals/{id}', { params: { path: { id } } });
    if (!result.response.ok) throw apiErrorFromResponse(result.response.status, result.error);
  }

  async linkGoalFocus(goalId: UUID, input: LinkGoalFocusInput): Promise<Goal> {
    const result = await this.client.POST('/v1/goals/{id}/focuses', { params: { path: { id: goalId } }, body: linkGoalFocusToAPI(input) });
    return goalFromAPI(assertData(result).goal);
  }

  async unlinkGoalFocus(goalId: UUID, focusId: UUID): Promise<Goal> {
    const result = await this.client.DELETE('/v1/goals/{id}/focuses/{focusId}', { params: { path: { id: goalId, focusId } } });
    return goalFromAPI(assertData(result).goal);
  }
}

function toFocusQueryParams(query: Omit<FocusQuery, 'limit' | 'cursor'>): { include?: string; depth?: number };
function toFocusQueryParams(query: FocusQuery): { limit?: number; cursor?: string; include?: string; depth?: number };
function toFocusQueryParams(query: FocusQuery) {
  return {
    limit: query.limit,
    cursor: query.cursor,
    include: query.include?.join(','),
    depth: query.depth,
  };
}