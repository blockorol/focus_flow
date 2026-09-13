'use client';

import type { CreateGoalInput, Focus, Goal, UpdateGoalInput } from '@/api';
import { EmptyState } from '@/ui';
import { CreateGoalForm } from './create-goal-form';
import { GoalCard } from './goal-card';

type GoalsPanelProps = {
  focus: Focus;
  goals: Goal[];
  onCreate(input: CreateGoalInput): Promise<void>;
  onSave(goalId: string, input: UpdateGoalInput): Promise<void>;
  onDelete(goalId: string): Promise<void>;
  onLink(goalId: string, focusId: string): Promise<void>;
  onUnlink(goalId: string, focusId: string): Promise<void>;
};

export function GoalsPanel({ focus, goals, onCreate, onSave, onDelete, onLink, onUnlink }: GoalsPanelProps) {
  return (
    <div className="grid gap-5">
      <CreateGoalForm onCreate={onCreate} />

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">Goals</h2>
        {goals.length > 0 ? (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} linkCandidates={focus.children} onSave={onSave} onDelete={onDelete} onLink={onLink} onUnlink={onUnlink} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Goals yet" description="Create a Goal to define the outcome for this Focus." />
        )}
      </section>
    </div>
  );
}

