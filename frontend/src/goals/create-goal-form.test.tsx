import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreateGoalForm } from './create-goal-form';

describe('CreateGoalForm', () => {
  it('renders Goal creation fields', () => {
    const html = renderToStaticMarkup(<CreateGoalForm onCreate={async () => undefined} />);

    expect(html).toContain('Type');
    expect(html).toContain('Description');
    expect(html).toContain('Status override');
    expect(html).toContain('Derived');
    expect(html).toContain('Add Goal');
  });
});
