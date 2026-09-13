import { AppShell, PageHeader } from '@/app-shell';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Field, Input, Select, Textarea } from '@/ui';

export default function Home() {
  return (
    <AppShell activePathname="/">
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Mock workspace"
          title="Make room for what matters."
          description="The protected app shell is ready for the mock-first Flow, Focus, and Goal screens."
          actions={<Button>New Flow</Button>}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Flow card</CardTitle>
                <CardDescription>A reusable card shell for the next UI steps.</CardDescription>
              </div>
              <Badge tone="success">Active</Badge>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p>Cards, badges, and buttons share semantic design tokens.</p>
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
                <CardDescription>Inputs are ready for Flow, Focus, and Goal forms.</CardDescription>
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

        <EmptyState title="Flows UI comes next" description="The next step will replace this placeholder with mock Flow cards and create Flow behavior." />
      </div>
    </AppShell>
  );
}