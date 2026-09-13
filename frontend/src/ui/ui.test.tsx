import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, ErrorState, Field, Input, LoadingState, Select, Textarea } from '.';
import { cn } from './styles';

describe('UI foundation', () => {
  it('joins conditional class names without empty values', () => {
    expect(cn('base', false, null, undefined, 'active')).toBe('base active');
  });

  it('renders shared card, badge, and button primitives', () => {
    const html = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Flow card</CardTitle>
            <CardDescription>Reusable shell.</CardDescription>
          </div>
          <Badge tone="success">Active</Badge>
        </CardHeader>
        <CardContent>
          <Button>Open</Button>
        </CardContent>
      </Card>,
    );

    expect(html).toContain('Flow card');
    expect(html).toContain('Reusable shell.');
    expect(html).toContain('Active');
    expect(html).toContain('bg-action');
  });

  it('renders form controls through field wrappers', () => {
    const html = renderToStaticMarkup(
      <form>
        <Field label="Name" description="Visible to you only." error="Required">
          <Input name="name" placeholder="Job Search" />
        </Field>
        <Select defaultValue="planned">
          <option value="planned">Planned</option>
        </Select>
        <Textarea placeholder="Notes" />
      </form>,
    );

    expect(html).toContain('Name');
    expect(html).toContain('Visible to you only.');
    expect(html).toContain('Required');
    expect(html).toContain('Job Search');
    expect(html).toContain('Planned');
  });

  it('renders reusable state blocks', () => {
    const html = renderToStaticMarkup(
      <div>
        <EmptyState title="No flows yet" description="Create the first Flow." />
        <ErrorState title="Could not save" description="Try again." />
        <LoadingState title="Loading" description="Fetching your workspace." />
      </div>,
    );

    expect(html).toContain('No flows yet');
    expect(html).toContain('Could not save');
    expect(html).toContain('Loading');
  });
});
