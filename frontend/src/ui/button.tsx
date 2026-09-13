import type { ButtonHTMLAttributes } from 'react';
import { cn } from './styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-action text-action-foreground shadow-sm hover:bg-action-hover focus-visible:outline-action',
  secondary: 'border border-border bg-surface text-text-primary shadow-sm hover:bg-surface-muted focus-visible:outline-action',
  ghost: 'text-text-muted hover:bg-surface-muted hover:text-text-primary focus-visible:outline-action',
  danger: 'bg-danger text-danger-foreground shadow-sm hover:bg-danger-hover focus-visible:outline-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-control px-3 text-sm',
  md: 'h-10 rounded-control px-4 text-sm',
};

export function Button({ className, variant = 'primary', size = 'md', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
