import Link from 'next/link';
import type { Focus } from '@/api';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import { flowStatusLabel, flowStatusTone } from './status';

type FlowCardProps = {
  flow: Focus;
};

export function FlowCard({ flow }: FlowCardProps) {
  return (
    <Card className="grid gap-5 hover:shadow-card-hover lg:grid-cols-[1fr_8rem]" style={{ borderLeftColor: flow.color ?? '#0f766e', borderLeftWidth: '0.5rem' }}>
      <div className="grid gap-4">
        <CardHeader className="mb-0">
          <div>
            <CardTitle>{flow.name}</CardTitle>
            {flow.description ? <CardDescription>{flow.description}</CardDescription> : <CardDescription>No description yet.</CardDescription>}
          </div>
          <Badge tone={flowStatusTone(flow.status)}>{flowStatusLabel(flow.status)}</Badge>
        </CardHeader>

        <CardContent className="grid gap-4">
          {flow.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {flow.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-control bg-surface-muted p-4 sm:grid-cols-2">
            <FlowMetric label="Child focuses" value={flow.children.length} />
            <FlowMetric label="Goals" value={flow.goals.length} />
          </div>
        </CardContent>
      </div>

      <div className="grid content-start gap-2 justify-self-start lg:justify-self-end">
        <Link
          href={`/focuses/${flow.id}`}
          className="inline-flex h-9 items-center justify-center rounded-control border border-border bg-surface px-3 text-sm font-medium text-text-primary shadow-sm transition hover:border-border-strong hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
        >
          Open
        </Link>
      </div>
    </Card>
  );
}

function FlowMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
