'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { WidgetProps } from '@rjsf/utils';
import { FormErrorMessage, Textarea } from '@sk-web-gui/react';

// Use Textarea as a fallback for the text editor in preview mode
// The actual TextEditor from @sk-web-gui/text-editor can cause SSR issues
export function TexteditorWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, options = {} } = props;

  const placeholder = (options as any)?.placeholder || 'Skriv text här... (Rich text editor i produktion)';
  const customClassName = (options as any)?.className || 'w-full min-h-[22rem]';
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
        rows={8}
      />
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default TexteditorWidget;
