'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { FormErrorMessage, Select } from '@sk-web-gui/react';

export function SelectWidget(props: WidgetProps) {
  const { id, value, disabled, readonly, onChange, rawErrors, options = {} } = props;
  const enumOptions = ((options as any).enumOptions as { value: any; label: string }[]) || [];
  const customClassName = (options as any)?.className || 'w-full';
  const placeholder = (options as any)?.placeholder;

  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  const currentValue = value === undefined || value === null ? '' : value;

  // Check if there's already an empty value option in enumOptions (from oneOf with const: "")
  const hasEmptyOption = enumOptions.some((o) => o.value === '' || o.value === null || o.value === undefined);

  // Get the label for the empty option if it exists, otherwise use placeholder or default
  const emptyOptionLabel = hasEmptyOption
    ? enumOptions.find((o) => o.value === '' || o.value === null || o.value === undefined)?.label
    : placeholder || 'Välj...';

  // Filter out empty option from enumOptions since we handle it separately
  const filteredOptions = enumOptions.filter((o) => o.value !== '' && o.value !== null && o.value !== undefined);

  return (
    <div className="w-full">
      <Select
        className={customClassName}
        id={id}
        value={currentValue}
        onChange={(e) => onChange(e.currentTarget.value || undefined)}
        disabled={!!(disabled || readonly)}
      >
        <Select.Option value="">{emptyOptionLabel}</Select.Option>
        {filteredOptions.map((o) => (
          <Select.Option key={String(o.value)} value={o.value}>
            {o.label}
          </Select.Option>
        ))}
      </Select>
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default SelectWidget;
