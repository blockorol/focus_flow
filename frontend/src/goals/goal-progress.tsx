import type { GoalProgress as GoalProgressModel } from '@/api';
import { flowStatusLabel } from '@/flows';

type GoalProgressProps = {
  progress: GoalProgressModel;
};

export function GoalProgress({ progress }: GoalProgressProps) {
  const donePercent = progress.linkedCount > 0 ? Math.round((progress.doneCount / progress.linkedCount) * 100) : 0;
  const resolvedPercent = progress.linkedCount > 0 ? Math.round((progress.terminalCount / progress.linkedCount) * 100) : 0;
  const statusEntries = Object.entries(progress.statusCounts).filter((entry): entry is [keyof GoalProgressModel['statusCounts'], number] => typeof entry[1] === 'number');

  return (
    <div className="grid gap-3 rounded-control bg-surface-muted p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Linked" value={progress.linkedCount} />
        <Metric label="Done" value={`${donePercent}%`} />
        <Metric label="Resolved" value={`${resolvedPercent}%`} />
      </div>

      {statusEntries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {statusEntries.map(([status, count]) => (
            <span key={status} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-border">
              {flowStatusLabel(status)}: {count}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-subtle">No linked Focus progress yet.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

