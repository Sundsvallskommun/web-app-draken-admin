import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { toCategoryTypePayload, toCategoryTypeRows, validateCategoryTypes } from '../category-types';
import { CategoryTypesField } from '../category-types-field';
import { validationRulesFor } from '../resource-form-validation';

const apiTypes = [
  {
    name: 'RENT',
    displayName: 'Hyra',
    escalationEmail: 'rent@example.com',
    deprecated: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
  { name: 'KEYS', deprecated: true },
];

describe('category types', () => {
  it('turns api types into editable rows without server-only fields', () => {
    expect(toCategoryTypeRows(apiTypes)).toEqual([
      { name: 'RENT', displayName: 'Hyra', escalationEmail: 'rent@example.com', deprecated: false },
      { name: 'KEYS', displayName: '', escalationEmail: '', deprecated: true },
    ]);
    expect(toCategoryTypeRows(undefined)).toEqual([]);
  });

  it('sends every type with its deprecated flag and leaves blank optional fields out', () => {
    expect(
      toCategoryTypePayload([
        { name: ' RENT ', displayName: 'Hyra', escalationEmail: ' rent@example.com ', deprecated: false },
        { name: 'KEYS', displayName: '  ', escalationEmail: '', deprecated: true },
      ])
    ).toEqual([
      { name: 'RENT', displayName: 'Hyra', escalationEmail: 'rent@example.com', deprecated: false },
      { name: 'KEYS', deprecated: true },
    ]);
  });

  it('requires unique names and valid escalation emails', () => {
    const row = (name, escalationEmail = '') => ({ name, displayName: '', escalationEmail, deprecated: false });

    expect(validateCategoryTypes([row('RENT', 'rent@example.com'), row('KEYS')])).toBe(true);
    expect(validateCategoryTypes([row(' ')])).toBe('Varje typ behöver ett namn.');
    expect(validateCategoryTypes([row('RENT'), row('RENT')])).toBe('Typen "RENT" finns redan.');
    expect(validateCategoryTypes([row('RENT', 'not-an-email')])).toBe(
      'Ange en giltig eskaleringsadress för typen "RENT", till exempel namn@domän.se.'
    );
  });

  it('validates the category types field in the resource form', () => {
    const rules = validationRulesFor({ key: 'types', label: 'Typer', type: 'categoryTypes' }, false);

    expect(rules?.validate?.([{ name: 'RENT', escalationEmail: 'nope' }])).toContain('giltig eskaleringsadress');
  });
});

describe('CategoryTypesField', () => {
  const renderField = (props) =>
    render(
      React.createElement(CategoryTypesField, {
        value: toCategoryTypeRows(apiTypes),
        existingTypeCount: 2,
        onChange: jest.fn(),
        ...props,
      })
    );

  it('lets an existing type get an escalation email', () => {
    const onChange = jest.fn();
    renderField({ onChange });

    fireEvent.change(screen.getByLabelText('Eskaleringsadress för KEYS'), { target: { value: 'keys@example.com' } });

    expect(onChange).toHaveBeenCalledWith([
      { name: 'RENT', displayName: 'Hyra', escalationEmail: 'rent@example.com', deprecated: false },
      { name: 'KEYS', displayName: '', escalationEmail: 'keys@example.com', deprecated: true },
    ]);
  });

  it('locks the name of existing types and only lets new types be removed', () => {
    renderField({
      value: [
        ...toCategoryTypeRows(apiTypes),
        { name: 'PARKING', displayName: '', escalationEmail: '', deprecated: false },
      ],
    });

    expect(screen.getByLabelText('Namn för Hyra')).toBeDisabled();
    expect(screen.getByLabelText('Namn för PARKING')).not.toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Ta bort Hyra' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ta bort PARKING' })).toBeInTheDocument();
  });

  it('deprecates an existing type instead of removing it', () => {
    const onChange = jest.fn();
    renderField({ onChange });

    fireEvent.click(screen.getAllByRole('switch')[0]);

    expect(onChange.mock.calls[0][0][0]).toMatchObject({ name: 'RENT', deprecated: true });
  });

  it('adds an empty type row', () => {
    const onChange = jest.fn();
    renderField({ onChange });

    fireEvent.click(screen.getByRole('button', { name: 'Lägg till typ' }));

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
    expect(onChange.mock.calls[0][0][2]).toEqual({ name: '', displayName: '', escalationEmail: '', deprecated: false });
  });
});
