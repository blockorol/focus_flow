import { describe, expect, it } from 'vitest';
import { flowStatusLabel, flowStatusTone, formatFlowDate } from './status';

describe('Flow status helpers', () => {
  it('maps statuses to labels and semantic tones', () => {
    expect(flowStatusLabel('active')).toBe('Active');
    expect(flowStatusTone('active')).toBe('success');
    expect(flowStatusLabel('cancelled')).toBe('Cancelled');
    expect(flowStatusTone('cancelled')).toBe('danger');
  });

  it('formats backend timestamps for cards', () => {
    expect(formatFlowDate('2026-09-13T12:00:00Z')).toContain('2026');
  });
});

