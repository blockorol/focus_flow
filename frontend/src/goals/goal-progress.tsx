import type { GoalProgress as GoalProgressModel } from '@/api';

type GoalProgressProps = {
  progress: GoalProgressModel;
};

export function GoalProgress({ progress }: GoalProgressProps) {
  const donePercent = progress.linkedCount > 0 ? Math.round((progress.doneCount / progress.linkedCount) * 100) : 0;
  const resolvedPercent = progress.linkedCount > 0 ? Math.round((progress.terminalCount / progress.linkedCount) * 100) : 0;
  const segments = progressSegments(progress);

  return (
    <div className="grid gap-3 rounded-control bg-surface-muted p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Linked" value={progress.linkedCount} />
        <Metric label="Done" value={`${donePercent}%`} />
        <Metric label="Resolved" value={`${resolvedPercent}%`} />
      </div>

      {segments.length > 0 ? (
        <div className="grid gap-2">
          <div className="flex h-3 overflow-hidden rounded-full bg-surface ring-1 ring-border" aria-label="Goal progress by linked Focus status">
            {segments.map((segment) => (
              <span className={segment.className} key={segment.label} style={{ width: `${segment.percent}%` }} title={`${segment.label}: ${segment.count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {segments.map((segment) => (
              <span key={segment.label} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-text-muted ring-1 ring-border">
                <span className={segment.dotClassName} aria-hidden="true" />
                {segment.label}: {segment.count}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-subtle">No linked Focus progress yet.</p>
      )}
    </div>
  );
}

export function MiniGoalProgress({ progress }: GoalProgressProps) {
  const segments = progressSegments(progress);
  if (segments.length === 0) {
    return <span className="h-2 rounded-full bg-surface-muted ring-1 ring-border" aria-label="No linked Focus progress yet." />;
  }
  return (
    <span className="flex h-2 overflow-hidden rounded-full bg-surface ring-1 ring-border" aria-label="Goal progress by linked Focus status">
      {segments.map((segment) => (
        <span className={segment.className} key={segment.label} style={{ width: `${segment.percent}%` }} title={`${segment.label}: ${segment.count}`} />
      ))}
    </span>
  );
}

function progressSegments(progress: GoalProgressModel) {
  if (progress.linkedCount <= 0) return [];
  const planned = (progress.statusCounts.idea ?? 0) + (progress.statusCounts.planned ?? 0);
  const inProgress = (progress.statusCounts.active ?? 0) + (progress.statusCounts.paused ?? 0) + (progress.statusCounts.waiting ?? 0);
  const done = progress.statusCounts.done ?? 0;
  const cancelled = progress.statusCounts.cancelled ?? 0;
  return [
    { label: 'Done', count: done, className: 'bg-success', dotClassName: 'h-2 w-2 rounded-full bg-success' },
    { label: 'In progress', count: inProgress, className: 'bg-info', dotClassName: 'h-2 w-2 rounded-full bg-info' },
    { label: 'Planned', count: planned, className: 'bg-border-strong', dotClassName: 'h-2 w-2 rounded-full bg-border-strong' },
    { label: 'Cancelled', count: cancelled, className: 'bg-danger', dotClassName: 'h-2 w-2 rounded-full bg-danger' },
  ]
    .filter((segment) => segment.count > 0)
    .map((segment) => ({ ...segment, percent: Math.max(4, Math.round((segment.count / progress.linkedCount) * 100)) }));
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
