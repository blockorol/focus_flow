'use client';

import { useState, type FormEvent } from 'react';
import type { Focus, FocusStatus, UpdateFocusInput } from '@/api';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Field, Input, Select, Textarea } from '@/ui';
import { flowStatusLabel } from '@/flows';

const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type FocusEditFormProps = {
  focus: Focus;
  onSave(input: UpdateFocusInput): Promise<Focus>;
};

export function FocusEditForm({ focus, onSave }: FocusEditFormProps) {
  const [name, setName] = useState(focus.name);
  const [status, setStatus] = useState<FocusStatus>(focus.status);
  const [tags, setTags] = useState(focus.tags.join(', '));
  const [description, setDescription] = useState(focus.description ?? '');
  const [feedback, setFeedback] = useState(focus.feedback ?? '');
  const [color, setColor] = useState(focus.color ?? '');
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildUpdateFocusInput({ name, status, tags, description, feedback, color });
    if (!input) {
      setError('Focus name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSavedMessage(null);
    try {
      const updated = await onSave(input);
      setName(updated.name);
      setStatus(updated.status);
      setTags(updated.tags.join(', '));
      setDescription(updated.description ?? '');
      setFeedback(updated.feedback ?? '');
      setColor(updated.color ?? '');
      setSavedMessage('Focus updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Focus could not be updated.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Edit Focus</CardTitle>
          <CardDescription>Update generic Focus fields. Hierarchy changes stay out of this form.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={submit}>
          <Field label="Name" error={error ?? undefined}>
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={submitting} />
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

          <Field label="Tags" description="Separate tags with commas. Clear the field to remove all tags.">
            <Input value={tags} onChange={(event) => setTags(event.target.value)} disabled={submitting} />
          </Field>

          <Field label="Description" description="Clear the field to remove the description.">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={submitting} />
          </Field>

          <Field label="Feedback" description="Clear the field to remove feedback.">
            <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} disabled={submitting} />
          </Field>

          <Field label="Color" description="Use a simple marker such as #175cd3. Clear the field to remove the marker.">
            <Input value={color} onChange={(event) => setColor(event.target.value)} placeholder="#175cd3" disabled={submitting} />
          </Field>

          {savedMessage ? <p className="text-sm font-medium text-success">{savedMessage}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Focus'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type FocusEditDraft = {
  name: string;
  status: FocusStatus;
  tags: string;
  description: string;
  feedback: string;
  color: string;
};

export function buildUpdateFocusInput(draft: FocusEditDraft): UpdateFocusInput | null {
  const name = draft.name.trim();
  if (!name) return null;

  const clearFields: UpdateFocusInput['clearFields'] = [];
  const input: UpdateFocusInput = {
    name,
    status: draft.status,
    tags: draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  };

  const description = draft.description.trim();
  if (description) {
    input.description = description;
  } else {
    clearFields.push('description');
  }

  const feedback = draft.feedback.trim();
  if (feedback) {
    input.feedback = feedback;
  } else {
    clearFields.push('feedback');
  }

  const color = draft.color.trim();
  if (color) {
    input.color = color;
  } else {
    clearFields.push('color');
  }

  if (clearFields.length > 0) input.clearFields = clearFields;
  return input;
}

