import type { Focus } from '@/api';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import { flowStatusLabel, flowStatusTone, formatFlowDate } from '@/flows';

type FocusSummaryProps = {
  focus: Focus;
};

export function FocusSummary({ focus }: FocusSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{focus.name}</CardTitle>
          <CardDescription>
            Created {formatFlowDate(focus.createdAt)} - Updated {formatFlowDate(focus.updatedAt)}
          </CardDescription>
        </div>
        <Badge tone={flowStatusTone(focus.status)}>{flowStatusLabel(focus.status)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FocusField label="Description" value={focus.description ?? 'No description yet.'} muted={!focus.description} />
          <FocusField label="Feedback" value={focus.feedback ?? 'No feedback yet.'} muted={!focus.feedback} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FocusMetric label="Child focuses" value={focus.children.length} />
          <FocusMetric label="Goals" value={focus.goals.length} />
          <FocusColor color={focus.color} />
        </div>

        {focus.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {focus.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-subtle">No tags yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function FocusField({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">{label}</p>
      <p className={muted ? 'mt-2 text-sm leading-6 text-text-subtle' : 'mt-2 text-sm leading-6 text-text-primary'}>{value}</p>
    </div>
  );
}

function FocusMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function FocusColor({ color }: { color: string | null }) {
  return (
    <div className="rounded-control bg-surface-muted p-4">
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 rounded-full border border-border" style={{ backgroundColor: color ?? 'transparent' }} aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-text-primary">{color ?? 'No color'}</p>
          <p className="text-xs text-text-muted">Color marker</p>
        </div>
      </div>
    </div>
  );
}
