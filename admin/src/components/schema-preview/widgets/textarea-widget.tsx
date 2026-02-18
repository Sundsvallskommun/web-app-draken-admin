'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { FormErrorMessage, Textarea } from '@sk-web-gui/react';

export function TextareaWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, options = {}, schema = {}, placeholder: uiPlaceholder } = props;

  // ui:placeholder comes as prop, ui:options.placeholder comes in options
  const placeholder = uiPlaceholder || (options as any)?.placeholder || (schema as any)?.default || '';
  const customClassName = (options as any)?.className || 'w-full';
  const rows = (options as any)?.rows ?? 4;
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value || '');
  };

  return (
    <div className="w-full">
      <Textarea
        id={id}
        className={customClassName}
        value={value ?? ''}
        onChange={handleChange}
        disabled={!!(disabled || readonly)}
        placeholder={placeholder}
        rows={rows}
      />
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default TextareaWidget;
