'use client';

import { useState, type FormEvent } from 'react';
import type { CreateFlowInput, FocusStatus } from '@/api';
import { Button, Field, Input, Select, Textarea } from '@/ui';

const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type CreateFlowFormProps = {
  onCreate(input: CreateFlowInput): Promise<void>;
  onCreated?(): void;
};

export function CreateFlowForm({ onCreate, onCreated }: CreateFlowFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<FocusStatus>('planned');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Flow name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
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
      onCreated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Flow could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Field label="Name" error={error ?? undefined}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Job Search" disabled={submitting} />
      </Field>

      <Field label="Status">
        <Select value={status} onChange={(event) => setStatus(event.target.value as FocusStatus)} disabled={submitting}>
          {statuses.map((nextStatus) => (
            <option key={nextStatus} value={nextStatus}>
              {nextStatus}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tags" description="Separate tags with commas.">
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="career, interview" disabled={submitting} />
      </Field>

      <Field label="Description">
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What belongs inside this Flow?" disabled={submitting} />
      </Field>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Flow'}
      </Button>
    </form>
  );
}
