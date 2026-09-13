import Link from 'next/link';
import type { Focus } from '@/api';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import { flowStatusLabel, flowStatusTone, formatFlowDate } from '@/flows';

type ChildFocusCardProps = {
  focus: Focus;
};

export function ChildFocusCard({ focus }: ChildFocusCardProps) {
  return (
    <Card className="hover:shadow-card-hover">
      <CardHeader>
        <div>
          <CardTitle>{focus.name}</CardTitle>
          <CardDescription>Updated {formatFlowDate(focus.updatedAt)}</CardDescription>
        </div>
        <Badge tone={flowStatusTone(focus.status)}>{flowStatusLabel(focus.status)}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4">
        {focus.description ? <p className="leading-6 text-text-muted">{focus.description}</p> : <p className="leading-6 text-text-subtle">No description yet.</p>}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-text-muted">
            {focus.children.length} child focuses · {focus.goals.length} goals
          </p>
          <Link
            href={`/focuses/${focus.id}`}
            className="inline-flex h-9 items-center justify-center rounded-control border border-border bg-surface px-3 text-sm font-medium text-text-primary shadow-sm transition hover:border-border-strong hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            Open
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
