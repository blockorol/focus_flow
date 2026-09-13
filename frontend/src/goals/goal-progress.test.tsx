import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GoalProgress } from './goal-progress';

describe('GoalProgress', () => {
  it('renders linked progress percentages and status counts', () => {
    const html = renderToStaticMarkup(
      <GoalProgress progress={{ linkedCount: 4, terminalCount: 3, doneCount: 2, statusCounts: { done: 2, cancelled: 1, active: 1 } }} />,
    );

    expect(html).toContain('Linked');
    expect(html).toContain('Done');
    expect(html).toContain('50%');
    expect(html).toContain('Resolved');
    expect(html).toContain('75%');
    expect(html).toContain('Cancelled: 1');
  });

  it('renders empty progress copy without linked Focuses', () => {
    const html = renderToStaticMarkup(<GoalProgress progress={{ linkedCount: 0, terminalCount: 0, doneCount: 0, statusCounts: {} }} />);

    expect(html).toContain('No linked Focus progress yet.');
  });
});

