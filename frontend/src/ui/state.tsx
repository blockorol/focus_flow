import type { HTMLAttributes } from 'react';
import { cn } from './styles';

type StateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
};

export function EmptyState({ title, description, className, children, ...props }: StateProps) {
  return (
    <div className={cn('rounded-card border border-dashed border-border bg-surface-muted p-8 text-center', className)} {...props}>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">{description}</p> : null}
      {children ? <div className="mt-5 flex justify-center">{children}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description, className, children, ...props }: StateProps) {
  return (
    <div className={cn('rounded-card border border-danger/20 bg-danger-muted p-5', className)} {...props}>
      <h2 className="text-base font-semibold text-danger">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-danger">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function LoadingState({ title, description, className, ...props }: StateProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-card border border-border bg-surface p-5 shadow-card', className)} {...props}>
      <span className="h-3 w-3 animate-pulse rounded-full bg-action" aria-hidden="true" />
      <div>
        <h2 className="text-sm font-medium text-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
