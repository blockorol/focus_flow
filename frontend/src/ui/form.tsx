import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './styles';

type FieldProps = {
  label: string;
  description?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
      {description ? <span className="text-xs leading-5 text-text-muted">{description}</span> : null}
      {error ? <span className="text-xs leading-5 text-danger">{error}</span> : null}
    </label>
  );
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-text-primary', className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-subtle focus:border-action focus:ring-2 focus:ring-action/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-subtle focus:border-action focus:ring-2 focus:ring-action/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-control border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-action focus:ring-2 focus:ring-action/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
        className,
      )}
      {...props}
    />
  );
}
