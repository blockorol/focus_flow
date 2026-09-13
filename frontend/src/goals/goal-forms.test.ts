import { describe, expect, it } from 'vitest';
import { buildCreateGoalInput, buildUpdateGoalInput } from './goal-forms';

describe('Goal form builders', () => {
  it('builds create requests with optional status override', () => {
    expect(buildCreateGoalInput({ type: 'primary', description: ' Finish the interview loop ', statusOverride: 'active' })).toEqual({
      type: 'primary',
      description: 'Finish the interview loop',
      statusOverride: 'active',
    });
  });

  it('builds create requests with derived status', () => {
    expect(buildCreateGoalInput({ type: 'secondary', description: 'Collect feedback', statusOverride: '' })).toEqual({
      type: 'secondary',
      description: 'Collect feedback',
      statusOverride: null,
    });
  });

  it('builds update requests and clears empty status override', () => {
    expect(buildUpdateGoalInput({ type: 'primary', description: 'Collect written feedback', statusOverride: '' })).toEqual({
      type: 'primary',
      description: 'Collect written feedback',
      clearFields: ['statusOverride'],
    });
  });

  it('rejects blank goal descriptions', () => {
    expect(buildCreateGoalInput({ type: 'primary', description: '   ', statusOverride: '' })).toBeNull();
    expect(buildUpdateGoalInput({ type: 'primary', description: '   ', statusOverride: '' })).toBeNull();
  });
});

