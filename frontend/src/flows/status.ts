import type { FocusStatus } from '@/api';
import type { BadgeTone } from '@/ui/badge';

const labels: Record<FocusStatus, string> = {
  idea: 'Idea',
  planned: 'Planned',
  active: 'Active',
  paused: 'Paused',
  waiting: 'Waiting',
  done: 'Done',
  cancelled: 'Cancelled',
};

const tones: Record<FocusStatus, BadgeTone> = {
  idea: 'neutral',
  planned: 'info',
  active: 'success',
  paused: 'warning',
  waiting: 'warning',
  done: 'success',
  cancelled: 'danger',
};

export function flowStatusLabel(status: FocusStatus) {
  return labels[status];
}

export function flowStatusTone(status: FocusStatus) {
  return tones[status];
}

export function formatFlowDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

