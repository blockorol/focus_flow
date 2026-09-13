'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/app-shell';
import { FocusDashboard } from '@/focuses';

export default function FocusPage() {
  const params = useParams<{ focusId: string }>();

  return (
    <AppShell activePathname="/">
      <FocusDashboard focusId={params.focusId} />
    </AppShell>
  );
}

