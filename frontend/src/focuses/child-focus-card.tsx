import Link from 'next/link';
import type { Focus } from '@/api';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui';
import { flowStatusLabel, flowStatusTone, formatFlowDate } from '@/flows';

type ChildFocusCardProps = {
  focus: Focus;
};

export function ChildFocusCard({ focus }: ChildFocusCardProps) {
  const accent = focus.color ?? '#0f766e';

  return (
    <Link className="block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action" href={`/focuses/${focus.id}`}>
      <Card className="hover:shadow-card-hover" style={{ borderLeftColor: accent, borderLeftWidth: '0.375rem' }}>
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
              {focus.children.length} child focuses - {focus.goals.length} goals
            </p>
            <span className="text-sm font-medium text-action">Open</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
