'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { DatePicker, FormErrorMessage } from '@sk-web-gui/react';

export function DateWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, options = {} } = props;

  const customClassName = (options as any)?.className || 'w-full';
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  // DatePicker is a native input type="date", so value should be YYYY-MM-DD string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || undefined);
  };

  // Value should already be in YYYY-MM-DD format, or empty string
  const dateValue = value || '';

  return (
    <div className="w-full">
      <DatePicker
        id={id}
        value={dateValue}
        onChange={handleChange}
        disabled={!!(disabled || readonly)}
        className={customClassName}
      />
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default DateWidget;
