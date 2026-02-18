'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormErrorMessage, Input } from '@sk-web-gui/react';
import { getInputProps, WidgetProps } from '@rjsf/utils';

export const BaseInputTemplate: React.FC<WidgetProps> = ({
  id,
  type,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled,
  readonly,
  autofocus,
  placeholder,
  schema,
  rawErrors,
  options = {},
}) => {
  const inputProps = getInputProps(schema, type, {});
  const customClassName = (options as any)?.className || 'w-full';
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value === '' ? undefined : e.target.value);
  };

  return (
    <div className="w-full">
      <Input
        id={id}
        type={inputProps.type || 'text'}
        className={customClassName}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur && ((e) => onBlur(id, e.target.value))}
        onFocus={onFocus && ((e) => onFocus(id, e.target.value))}
        disabled={!!(disabled || readonly)}
        autoFocus={autofocus}
        placeholder={placeholder}
      />
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
};

export default BaseInputTemplate;
