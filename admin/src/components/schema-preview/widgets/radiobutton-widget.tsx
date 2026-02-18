'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { FormErrorMessage, RadioButton } from '@sk-web-gui/react';

export function RadiobuttonWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, options = {} } = props;

  const enumOptions = ((options as any).enumOptions as { value: any; label: string }[]) ?? [];
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  // Convert value to string for comparison
  const stringValue = value === true ? 'true' : value === false ? 'false' : String(value ?? '');

  const handleChange = (newValue: string) => {
    // Handle boolean values
    if (newValue === 'true') {
      onChange(true);
    } else if (newValue === 'false') {
      onChange(false);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-12">
        {enumOptions.map((opt) => {
          const optStringValue = opt.value === true ? 'true' : opt.value === false ? 'false' : String(opt.value);
          return (
            <RadioButton
              key={optStringValue}
              id={`${id}-${optStringValue}`}
              value={optStringValue}
              checked={stringValue === optStringValue}
              onChange={() => handleChange(optStringValue)}
              disabled={!!(disabled || readonly)}
            >
              {opt.label}
            </RadioButton>
          );
        })}
      </div>
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default RadiobuttonWidget;
