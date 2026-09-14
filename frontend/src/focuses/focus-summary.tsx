import type { Focus, FocusStatus } from '@/api';
import { Badge, Select } from '@/ui';
import { flowStatusLabel, flowStatusTone } from '@/flows';

type FocusSummaryProps = {
  focus: Focus;
  statusSaving?: boolean;
  onStatusChange?(status: FocusStatus): Promise<void> | void;
};

const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

export function FocusSummary({ focus, statusSaving = false, onStatusChange }: FocusSummaryProps) {
  return (
    <section className="grid gap-4 rounded-card border border-border bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <div className="grid content-start gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={flowStatusTone(focus.status)}>{flowStatusLabel(focus.status)}</Badge>
            {focus.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
                {tag}
              </span>
            ))}
          </div>
          {focus.feedback ? <FocusField label="Feedback" value={focus.feedback} /> : null}
        </div>

        <div className="grid gap-3 rounded-control bg-surface-muted p-4">
          <div className="grid grid-cols-2 gap-3">
            <FocusMetric label="Child focuses" value={focus.children.length} />
            <FocusMetric label="Goals" value={focus.goals.length} />
          </div>
          {onStatusChange ? (
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">Status</span>
              <Select value={focus.status} onChange={(event) => void onStatusChange(event.target.value as FocusStatus)} disabled={statusSaving}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {flowStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FocusField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text-primary">{value}</p>
    </div>
  );
}

function FocusMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
