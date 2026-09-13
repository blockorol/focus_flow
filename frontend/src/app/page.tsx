import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Field, Input, Select, Textarea } from '@/ui';

export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-card border border-border bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-widest text-action">FocusFlow</p>
        <nav className="mt-8 grid gap-2 text-sm">
          <a className="rounded-control bg-surface-muted px-3 py-2 font-medium text-text-primary" href="#">
            Flows
          </a>
          <a className="rounded-control px-3 py-2 text-text-muted hover:bg-surface-muted hover:text-text-primary" href="#">
            Goals
          </a>
        </nav>
      </aside>

      <section className="grid content-start gap-6">
        <div>
          <Badge tone="info">Design foundation</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary">Make room for what matters.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Shared components and functional colors are ready for the mock-first product UI.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Flow card</CardTitle>
                <CardDescription>A reusable card shell for the next UI steps.</CardDescription>
              </div>
              <Badge tone="success">Active</Badge>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p>Cards, badges, and buttons now share the same semantic design tokens.</p>
              <div className="flex gap-3">
                <Button>Primary action</Button>
                <Button variant="secondary">Secondary</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Form controls</CardTitle>
                <CardDescription>Inputs are ready for login, Flow, Focus, and Goal forms.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="Name">
                <Input placeholder="Job Search" />
              </Field>
              <Field label="Status">
                <Select defaultValue="planned">
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea placeholder="Describe the next useful step." />
              </Field>
            </CardContent>
          </Card>
        </div>

        <EmptyState title="Mock data comes next" description="The next step will add the typed API boundary and mock mode for successful frontend flows." />
      </section>
    </main>
  );
}
