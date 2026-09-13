import type { ReactNode } from 'react';

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-widest text-action">{eyebrow}</p> : null}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text-primary">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}