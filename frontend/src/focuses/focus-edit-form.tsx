'use client';

import { useState, type FormEvent } from 'react';
import type { Focus, FocusStatus, UpdateFocusInput } from '@/api';
import { flowStatusLabel } from '@/flows';
import { Button, Field, FieldLabel, Input, Select, Textarea } from '@/ui';

const statuses: FocusStatus[] = ['idea', 'planned', 'active', 'paused', 'waiting', 'done', 'cancelled'];

type FocusEditFormProps = {
  focus: Focus;
  onSave(input: UpdateFocusInput): Promise<Focus>;
  onSaved?(): void;
  formId?: string;
};

export function FocusEditForm({ focus, onSave, onSaved, formId }: FocusEditFormProps) {
  const [name, setName] = useState(focus.name);
  const [status, setStatus] = useState<FocusStatus>(focus.status);
  const [tags, setTags] = useState<string[]>(focus.tags);
  const [tagDraft, setTagDraft] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagDraft, setEditingTagDraft] = useState('');
  const [description, setDescription] = useState(focus.description ?? '');
  const [feedback, setFeedback] = useState(focus.feedback ?? '');
  const [color, setColor] = useState(focus.color ?? '');
  const [error, setError] = useState<string | null>(null);
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
    try {
      const updated = await onSave(input);
      setName(updated.name);
      setStatus(updated.status);
      setTags(updated.tags);
      setTagDraft('');
      setEditingTagIndex(null);
      setEditingTagDraft('');
      setDescription(updated.description ?? '');
      setFeedback(updated.feedback ?? '');
      setColor(updated.color ?? '');
      onSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Focus could not be updated.');
    } finally {
      setSubmitting(false);
    }
  }

  function addTag() {
    const nextTag = tagDraft.trim();
    if (!nextTag) return;
    setTags((current) => uniqueTags([...current, nextTag]));
    setTagDraft('');
  }

  function removeTag(index: number) {
    setTags((current) => current.filter((_, currentIndex) => currentIndex !== index));
    if (editingTagIndex === index) {
      setEditingTagIndex(null);
      setEditingTagDraft('');
    }
  }

  function startTagEdit(index: number) {
    setEditingTagIndex(index);
    setEditingTagDraft(tags[index] ?? '');
  }

  function saveTagEdit(index: number) {
    const nextTag = editingTagDraft.trim();
    setEditingTagIndex(null);
    setEditingTagDraft('');
    if (!nextTag) {
      removeTag(index);
      return;
    }
    setTags((current) => uniqueTags(current.map((tag, currentIndex) => (currentIndex === index ? nextTag : tag))));
  }

  function cancelTagEdit() {
    setEditingTagIndex(null);
    setEditingTagDraft('');
  }

  return (
    <form className="grid gap-4" id={formId} onSubmit={submit}>
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

      <div className="grid gap-2">
        <FieldLabel>Tags</FieldLabel>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Current tags">
            {tags.map((tag, index) =>
              editingTagIndex === index ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted p-1 ring-1 ring-border" key={`${tag}-${index}`}>
                  <Input className="h-8 w-44 rounded-full" value={editingTagDraft} onChange={(event) => setEditingTagDraft(event.target.value)} disabled={submitting} aria-label={`Edit ${tag} tag`} />
                  <Button variant="ghost" size="sm" onClick={() => saveTagEdit(index)} disabled={submitting} aria-label={`Save ${tag} tag`}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelTagEdit} disabled={submitting} aria-label={`Cancel editing ${tag} tag`}>
                    Cancel
                  </Button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted ring-1 ring-border" key={`${tag}-${index}`}>
                  <button className="rounded-full px-1 text-text-subtle hover:bg-surface hover:text-action" type="button" onClick={() => startTagEdit(index)} disabled={submitting} aria-label={`Edit ${tag} tag`}>
                    {String.fromCharCode(9998)}
                  </button>
                  <span>{tag}</span>
                  <button className="rounded-full px-1 text-text-subtle hover:bg-surface hover:text-danger" type="button" onClick={() => removeTag(index)} disabled={submitting} aria-label={`Remove ${tag} tag`}>
                    {String.fromCharCode(215)}
                  </button>
                </span>
              ),
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-text-muted">No tags yet.</p>
        )}
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag"
            disabled={submitting}
          />
          <Button variant="secondary" onClick={addTag} disabled={submitting || !tagDraft.trim()}>
            Add tag
          </Button>
        </div>
        <p className="text-xs leading-5 text-text-muted">Use tags to group related Focuses.</p>
      </div>

      <Field label="Description" description="Clear the field to remove the description.">
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={submitting} />
      </Field>

      <Field label="Feedback" description="Clear the field to remove feedback.">
        <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} disabled={submitting} />
      </Field>

      <Field label="Color" description="Use a simple marker such as #175cd3. Clear the field to remove the marker.">
        <Input value={color} onChange={(event) => setColor(event.target.value)} placeholder="#175cd3" disabled={submitting} />
      </Field>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Focus'}
      </Button>
    </form>
  );
}

type FocusEditDraft = {
  name: string;
  status: FocusStatus;
  tags: string | string[];
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
    tags: normalizeTags(draft.tags),
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

function normalizeTags(tags: string | string[]) {
  const rawTags = Array.isArray(tags) ? tags : tags.split(',');
  return uniqueTags(rawTags);
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}
