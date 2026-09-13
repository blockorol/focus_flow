'use client';

import { useState, type FormEvent } from 'react';
import type { CreateFocusInput, FocusStatus } from '@/api';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input, Select, Textarea } from '@/ui';
import { flowStatusLabel } from '@/flows';

type CreateChildFocusInput = Omit<CreateFocusInput, 'parentId'>;

const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type CreateChildFocusFormProps = {
  onCreate(input: CreateChildFocusInput): Promise<void>;
};

export function CreateChildFocusForm({ onCreate }: CreateChildFocusFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<FocusStatus>('planned');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Focus name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setCreatedMessage(null);
    try {
      await onCreate({
        name: trimmedName,
        status,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        description: description.trim() || null,
      });
      setName('');
      setStatus('planned');
      setTags('');
      setDescription('');
      setCreatedMessage('Child Focus created.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Child Focus could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Create child Focus</CardTitle>
          <CardDescription>Add the next nested unit of work under this Focus.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Name" error={error ?? undefined}>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Technical interview" disabled={submitting} />
          </Field>

          <Field label="Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as FocusStatus)} disabled={submitting}>
              {statuses.map((nextStatus) => (
                <option key={nextStatus} value={nextStatus}>
                  {flowStatusLabel(nextStatus)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tags" description="Separate tags with commas.">
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="interview, prep" disabled={submitting} />
          </Field>

          <Field label="Description">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should happen inside this Focus?" disabled={submitting} />
          </Field>

          {createdMessage ? <p className="text-sm font-medium text-success">{createdMessage}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create child Focus'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

