import { AppShell } from '@/app-shell';
import { FlowDashboard } from '@/flows';

export default function Home() {
  return (
    <AppShell activePathname="/">
      <FlowDashboard />
    </AppShell>
  );
}
