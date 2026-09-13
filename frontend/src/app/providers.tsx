'use client';

import { AuthProvider } from '@/auth/auth-provider';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}