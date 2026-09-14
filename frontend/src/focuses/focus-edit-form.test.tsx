import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FocusEditForm, buildUpdateFocusInput } from './focus-edit-form';
import { focusFixture } from './focus-summary.test';

describe('FocusEditForm', () => {
  it('renders generic Focus edit fields', () => {
    const html = renderToStaticMarkup(<FocusEditForm focus={focusFixture()} onSave={async (input) => ({ ...focusFixture(), ...input })} />);

    expect(html).toContain('Name');
    expect(html).toContain('Status');
    expect(html).toContain('Tags');
    expect(html).toContain('Current tags');
    expect(html).toContain('Edit interview tag');
    expect(html).toContain('Remove interview tag');
    expect(html).toContain('Add a tag');
    expect(html).toContain('Add tag');
    expect(html).toContain('Description');
    expect(html).toContain('Feedback');
    expect(html).toContain('Color');
    expect(html).toContain('Save Focus');
  });

  it('builds an update request with edited generic fields', () => {
    expect(
      buildUpdateFocusInput({
        name: 'Technical interview',
        status: 'active',
        tags: 'interview, prep',
        description: 'Prepare system design notes.',
        feedback: 'Ask for feedback after the call.',
        color: '#175cd3',
      }),
    ).toEqual({
      name: 'Technical interview',
      status: 'active',
      tags: ['interview', 'prep'],
      description: 'Prepare system design notes.',
      feedback: 'Ask for feedback after the call.',
      color: '#175cd3',
    });
  });

  it('builds an update request from managed tag chips', () => {
    expect(
      buildUpdateFocusInput({
        name: 'Technical interview',
        status: 'active',
        tags: ['interview', 'prep', 'interview', '  '],
        description: 'Prepare system design notes.',
        feedback: 'Ask for feedback after the call.',
        color: '#175cd3',
      }),
    ).toEqual({
      name: 'Technical interview',
      status: 'active',
      tags: ['interview', 'prep'],
      description: 'Prepare system design notes.',
      feedback: 'Ask for feedback after the call.',
      color: '#175cd3',
    });
  });

  it('uses clearFields for empty nullable text fields', () => {
    expect(
      buildUpdateFocusInput({
        name: 'Technical interview',
        status: 'planned',
        tags: '',
        description: '',
        feedback: '   ',
        color: '',
      }),
    ).toEqual({
      name: 'Technical interview',
      status: 'planned',
      tags: [],
      clearFields: ['description', 'feedback', 'color'],
    });
  });

  it('rejects an empty name before building the request', () => {
    expect(
      buildUpdateFocusInput({
        name: '   ',
        status: 'planned',
        tags: '',
        description: '',
        feedback: '',
        color: '',
      }),
    ).toBeNull();
  });
});
