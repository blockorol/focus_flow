import type { HTMLAttributes } from 'react';
import { cn } from './styles';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted ring-border',
  success: 'bg-success-muted text-success ring-success/20',
  warning: 'bg-warning-muted text-warning ring-warning/20',
  danger: 'bg-danger-muted text-danger ring-danger/20',
  info: 'bg-info-muted text-info ring-info/20',
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', toneClasses[tone], className)}
      {...props}
    />
  );
}
