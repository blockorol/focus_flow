import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditGoalForm } from './edit-goal-form';
import { goalFixture } from './goal-card.test';

describe('EditGoalForm', () => {
  it('renders Goal editing fields', () => {
    const html = renderToStaticMarkup(<EditGoalForm goal={goalFixture()} onSave={async () => undefined} />);

    expect(html).toContain('Type');
    expect(html).toContain('Description');
    expect(html).toContain('Status override');
    expect(html).toContain('Derived');
    expect(html).toContain('Save Goal');
  });
});
