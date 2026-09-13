'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/ui';
import { useAuth } from './auth-provider';

export function SessionSummary() {
  const router = useRouter();
  const { session, logout } = useAuth();

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-card">
      <div>
        <p className="text-sm font-medium text-text-primary">{session?.user.username ?? 'Not signed in'}</p>
        <p className="text-xs text-text-muted">Mock session expires at {session?.expiresAt ?? 'unknown'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={signOut}>
        Log out
      </Button>
    </div>
  );
}