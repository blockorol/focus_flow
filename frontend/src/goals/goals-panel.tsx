'use client';

import { useState } from 'react';
import type { Focus, Goal, UpdateGoalInput } from '@/api';
import { EmptyState, Modal } from '@/ui';
import { EditGoalForm } from './edit-goal-form';
import { GoalCard } from './goal-card';

type GoalsPanelProps = {
  focus: Focus;
  goals: Goal[];
  onSave(goalId: string, input: UpdateGoalInput): Promise<void>;
  onDelete(goalId: string): Promise<void>;
  onLink(goalId: string, focusId: string): Promise<void>;
  onUnlink(goalId: string, focusId: string): Promise<void>;
};

export function GoalsPanel({ focus, goals, onSave, onDelete, onLink, onUnlink }: GoalsPanelProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  return (
    <section className="grid gap-3">
      <Modal open={editingGoal !== null} title="Edit Goal" description="Update the Goal outcome and manual status override." onClose={() => setEditingGoal(null)}>
        {editingGoal ? <EditGoalForm goal={editingGoal} onSave={onSave} onSaved={() => setEditingGoal(null)} /> : null}
      </Modal>

      <h2 className="text-lg font-semibold tracking-tight text-text-primary">Goals</h2>
      {goals.length > 0 ? (
        <div className="grid gap-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} linkCandidates={focus.children} onEdit={setEditingGoal} onDelete={onDelete} onLink={onLink} onUnlink={onUnlink} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Goals yet" description="Add a Goal to define the outcome for this Focus." />
      )}
    </section>
  );
}
