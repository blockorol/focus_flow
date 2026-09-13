import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChildFocusCard } from './child-focus-card';
import { focusFixture } from './focus-summary.test';

describe('ChildFocusCard', () => {
  it('renders child Focus navigation', () => {
    const focus = focusFixture();
    const html = renderToStaticMarkup(<ChildFocusCard focus={focus} />);

    expect(html).toContain('Workato interview loop');
    expect(html).toContain(`/focuses/${focus.id}`);
    expect(html).toContain('Open');
  });
});

