import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreateChildFocusForm } from './create-child-focus-form';

describe('CreateChildFocusForm', () => {
  it('renders child Focus creation fields', () => {
    const html = renderToStaticMarkup(<CreateChildFocusForm onCreate={async () => undefined} />);

    expect(html).toContain('Add child Focus');
    expect(html).toContain('Name');
    expect(html).toContain('Status');
    expect(html).toContain('Tags');
    expect(html).toContain('Description');
  });
});
