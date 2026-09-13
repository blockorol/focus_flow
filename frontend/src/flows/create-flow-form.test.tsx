import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreateFlowForm } from './create-flow-form';

describe('CreateFlowForm', () => {
  it('renders the mock Flow creation fields', () => {
    const html = renderToStaticMarkup(<CreateFlowForm onCreate={async () => undefined} />);

    expect(html).toContain('Create Flow');
    expect(html).toContain('Name');
    expect(html).toContain('Status');
    expect(html).toContain('Tags');
    expect(html).toContain('Description');
    expect(html).toContain('Create Flow');
  });
});

