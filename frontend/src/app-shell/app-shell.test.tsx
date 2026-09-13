import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageHeader, Sidebar, appNavItems, isActiveNavItem } from '.';

describe('app shell navigation', () => {
  it('marks enabled navigation items active by pathname', () => {
    const [flows, goals] = appNavItems;
    if (!flows || !goals) throw new Error('Expected app navigation seed items.');

    expect(isActiveNavItem('/', flows)).toBe(true);
    expect(isActiveNavItem('/other', flows)).toBe(false);
    expect(isActiveNavItem('#goals', goals)).toBe(false);
  });

  it('renders sidebar navigation and disabled future items', () => {
    const html = renderToStaticMarkup(<Sidebar activePathname="/" />);

    expect(html).toContain('FocusFlow');
    expect(html).toContain('Flows');
    expect(html).toContain('Goals');
    expect(html).toContain('Soon');
    expect(html).toContain('aria-current="page"');
  });

  it('renders page header with optional actions', () => {
    const html = renderToStaticMarkup(<PageHeader eyebrow="Workspace" title="Flows" description="Choose a Flow." actions={<button>New Flow</button>} />);

    expect(html).toContain('Workspace');
    expect(html).toContain('Flows');
    expect(html).toContain('Choose a Flow.');
    expect(html).toContain('New Flow');
  });
});
