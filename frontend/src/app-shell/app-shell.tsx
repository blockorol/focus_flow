import type { ReactNode } from 'react';
import { AuthGate, SessionSummary } from '@/auth';
import { Sidebar } from './sidebar';

type AppShellProps = {
  activePathname?: string;
  children: ReactNode;
};

export function AppShell({ activePathname = '/', children }: AppShellProps) {
  return (
    <AuthGate>
      <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <Sidebar activePathname={activePathname} />
        <section className="grid content-start gap-6">
          <SessionSummary />
          <div className="rounded-card border border-border bg-surface/70 p-5 shadow-card sm:p-7">{children}</div>
        </section>
      </main>
    </AuthGate>
  );
}