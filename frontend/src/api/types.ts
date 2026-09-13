export type UUID = string;
export type Timestamp = string;

export type HealthStatus = {
  status: 'ok';
};

export type User = {
  id: UUID;
  username: string;
};

export type Session = {
  user: User;
  expiresAt: Timestamp;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type FocusStatus = 'idea' | 'planned' | 'active' | 'paused' | 'waiting' | 'done' | 'cancelled';
export type GoalType = 'primary' | 'secondary';

export type GoalProgress = {
  linkedCount: number;
  terminalCount: number;
  doneCount: number;
  statusCounts: Partial<Record<FocusStatus, number>>;
};

export type Goal = {
  id: UUID;
  ownerFocusId: UUID;
  type: GoalType;
  description: string;
  statusOverride: FocusStatus | null;
  linkedFocusIds: UUID[];
  progress: GoalProgress;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finishedAt: Timestamp | null;
};

export type Focus = {
  id: UUID;
  parentId: UUID | null;
  name: string;
  status: FocusStatus;
  tags: string[];
  description: string | null;
  feedback: string | null;
  color: string | null;
  goals: Goal[];
  children: Focus[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finishedAt: Timestamp | null;
};

export type CreateFocusInput = {
  parentId?: UUID | null;
  name: string;
  status?: FocusStatus;
  tags?: string[];
  description?: string | null;
  feedback?: string | null;
  color?: string | null;
};

export type CreateFlowInput = Omit<CreateFocusInput, 'parentId'>;

export type FocusClearField = 'parentId' | 'description' | 'feedback' | 'color';

export type UpdateFocusInput = {
  parentId?: UUID;
  name?: string;
  status?: FocusStatus;
  tags?: string[];
  description?: string;
  feedback?: string;
  color?: string;
  clearFields?: FocusClearField[];
};

export type Page<T> = {
  items: T[];
  count: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export type FocusPage = Page<Focus>;
export type GoalPage = Page<Goal>;

export type CreateGoalInput = {
  type: GoalType;
  description: string;
  statusOverride?: FocusStatus | null;
  linkedFocusIds?: UUID[];
};

export type GoalClearField = 'statusOverride';

export type UpdateGoalInput = {
  type?: GoalType;
  description?: string;
  statusOverride?: FocusStatus;
  linkedFocusIds?: UUID[];
  clearFields?: GoalClearField[];
};

export type LinkGoalFocusInput = {
  focusId: UUID;
};

export type PageRequest = {
  limit?: number;
  cursor?: string;
};

export type FocusInclude = 'children' | 'goals';

export type FocusQuery = PageRequest & {
  include?: FocusInclude[];
  depth?: number;
};

export interface FocusFlowAPI {
  getHealth(): Promise<HealthStatus>;
  login(input: LoginInput): Promise<Session>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<Session>;
  refreshSession(): Promise<Session>;
  listFlows(query?: FocusQuery): Promise<FocusPage>;
  createFlow(input: CreateFlowInput): Promise<Focus>;
  createFocus(input: CreateFocusInput): Promise<Focus>;
  getFocus(id: UUID, query?: Omit<FocusQuery, 'limit' | 'cursor'>): Promise<Focus>;
  updateFocus(id: UUID, input: UpdateFocusInput): Promise<Focus>;
  deleteFocus(id: UUID): Promise<void>;
  listFocusChildren(id: UUID, query?: FocusQuery): Promise<FocusPage>;
  listFocusGoals(id: UUID, query?: PageRequest): Promise<GoalPage>;
  createGoal(focusId: UUID, input: CreateGoalInput): Promise<Goal>;
  getGoal(id: UUID): Promise<Goal>;
  updateGoal(id: UUID, input: UpdateGoalInput): Promise<Goal>;
  deleteGoal(id: UUID): Promise<void>;
  linkGoalFocus(goalId: UUID, input: LinkGoalFocusInput): Promise<Goal>;
  unlinkGoalFocus(goalId: UUID, focusId: UUID): Promise<Goal>;
}