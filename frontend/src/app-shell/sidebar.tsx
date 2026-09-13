import Link from 'next/link';
import { Badge } from '@/ui';
import { cn } from '@/ui/styles';
import { appNavItems, isActiveNavItem } from './navigation';

type SidebarProps = {
  activePathname: string;
};

export function Sidebar({ activePathname }: SidebarProps) {
  return (
    <aside className="flex min-h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-action">FocusFlow</p>
        <p className="mt-3 text-sm leading-6 text-text-muted">A personal workspace for Focuses, Goals, and Specifications.</p>
      </div>

      <nav className="mt-8 grid gap-2 text-sm" aria-label="Main navigation">
        {appNavItems.map((item) => {
          const active = isActiveNavItem(activePathname, item);
          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-control px-3 py-2 transition',
                active ? 'bg-surface-muted font-medium text-text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text-primary',
                item.disabled && 'pointer-events-none opacity-60',
              )}
              href={item.href}
              key={item.label}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                {item.disabled ? <Badge tone="neutral">Soon</Badge> : null}
              </span>
              <span className="mt-1 block text-xs text-text-subtle">{item.description}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-card bg-surface-muted p-4 text-xs leading-5 text-text-muted">
        Mock mode is available for frontend review before real backend integration.
      </div>
    </aside>
  );
}