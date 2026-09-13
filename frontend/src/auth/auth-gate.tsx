'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from '@/ui';
import { useAuth } from './auth-provider';
import { redirectForProtectedRoute } from './routing';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const redirect = redirectForProtectedRoute(status, pathname);
    if (redirect) router.replace(redirect);
  }, [pathname, router, status]);

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <LoadingState title="Checking your session" description="Preparing your FocusFlow workspace." />
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return children;
}
