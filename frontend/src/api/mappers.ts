import type { components } from './generated/schema';
import type { CreateFlowInput, CreateFocusInput, CreateGoalInput, Focus, FocusStatus, Goal, GoalProgress, HealthStatus, LinkGoalFocusInput, LoginInput, Session, UpdateFocusInput, UpdateGoalInput } from './types';

type APIHealth = components['schemas']['HealthResponse'];
type APISession = components['schemas']['AuthSession'];
type APILoginRequest = components['schemas']['LoginRequest'];
type APIFocus = components['schemas']['Focus'];
type APIGoal = components['schemas']['Goal'];
type APIGoalProgress = components['schemas']['GoalProgress'];
type APICreateFlowRequest = components['schemas']['CreateFlowRequest'];
type APICreateFocusRequest = components['schemas']['CreateFocusRequest'];
type APIUpdateFocusRequest = components['schemas']['UpdateFocusRequest'];
type APICreateGoalRequest = components['schemas']['CreateGoalRequest'];
type APIUpdateGoalRequest = components['schemas']['UpdateGoalRequest'];
type APILinkGoalFocusRequest = components['schemas']['LinkGoalFocusRequest'];

export function healthFromAPI(value: APIHealth): HealthStatus {
  return { status: value.status };
}

export function loginToAPI(value: LoginInput): APILoginRequest {
  return { username: value.username, password: value.password };
}

export function sessionFromAPI(value: APISession): Session {
  return { user: { id: value.user.id, username: value.user.username }, expiresAt: value.expiresAt };
}

export function focusFromAPI(value: APIFocus): Focus {
  return {
    id: value.id,
    parentId: value.parentId,
    name: value.name,
    status: value.status,
    tags: [...value.tags],
    description: value.description,
    feedback: value.feedback,
    color: value.color,
    goals: value.goals.map(goalFromAPI),
    children: value.children.map(focusFromAPI),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    finishedAt: value.finishedAt,
  };
}

export function goalFromAPI(value: APIGoal): Goal {
  return {
    id: value.id,
    ownerFocusId: value.ownerFocusId,
    type: value.type,
    description: value.description,
    statusOverride: value.statusOverride,
    linkedFocusIds: [...value.linkedFocusIds],
    progress: goalProgressFromAPI(value.progress),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    finishedAt: value.finishedAt,
  };
}

export function createFlowToAPI(value: CreateFlowInput): APICreateFlowRequest {
  return {
    name: value.name,
    status: value.status,
    tags: value.tags,
    description: value.description,
    feedback: value.feedback,
    color: value.color,
  };
}

export function createFocusToAPI(value: CreateFocusInput): APICreateFocusRequest {
  return {
    ...createFlowToAPI(value),
    parentId: value.parentId,
  };
}

export function updateFocusToAPI(value: UpdateFocusInput): APIUpdateFocusRequest {
  return {
    parentId: value.parentId,
    name: value.name,
    status: value.status,
    tags: value.tags,
    description: value.description,
    feedback: value.feedback,
    color: value.color,
    clearFields: value.clearFields,
  };
}

export function createGoalToAPI(value: CreateGoalInput): APICreateGoalRequest {
  return {
    type: value.type,
    description: value.description,
    statusOverride: value.statusOverride,
    linkedFocusIds: value.linkedFocusIds,
  };
}

export function updateGoalToAPI(value: UpdateGoalInput): APIUpdateGoalRequest {
  return {
    type: value.type,
    description: value.description,
    statusOverride: value.statusOverride,
    linkedFocusIds: value.linkedFocusIds,
    clearFields: value.clearFields,
  };
}

export function linkGoalFocusToAPI(value: LinkGoalFocusInput): APILinkGoalFocusRequest {
  return { focusId: value.focusId };
}

function goalProgressFromAPI(value: APIGoalProgress): GoalProgress {
  const statusCounts: Partial<Record<FocusStatus, number>> = {};
  for (const [status, count] of Object.entries(value.statusCounts)) {
    if (isFocusStatus(status)) statusCounts[status] = count;
  }
  return {
    linkedCount: value.linkedCount,
    terminalCount: value.terminalCount,
    doneCount: value.doneCount,
    statusCounts,
  };
}

function isFocusStatus(value: string): value is FocusStatus {
  return value === 'idea' || value === 'planned' || value === 'active' || value === 'paused' || value === 'waiting' || value === 'done' || value === 'cancelled';
}