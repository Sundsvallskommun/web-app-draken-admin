'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { FormErrorMessage, Input } from '@sk-web-gui/react';

export function TextWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, options = {}, schema = {}, placeholder: uiPlaceholder } = props;

  // ui:placeholder comes as prop, ui:options.placeholder comes in options
  const placeholder = uiPlaceholder || (options as any)?.placeholder || (schema as any)?.default || '';
  const customClassName = (options as any)?.className || 'w-full';
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || '');
  };

  return (
    <div className="w-full">
      <Input
        id={id}
        type="text"
        className={customClassName}
        value={value ?? ''}
        onChange={handleChange}
        disabled={!!(disabled || readonly)}
        placeholder={placeholder}
      />
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default TextWidget;
