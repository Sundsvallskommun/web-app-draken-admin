'use client';

import type { WidgetProps } from '@rjsf/utils';
import { Checkbox, FormErrorMessage } from '@sk-web-gui/react';

export function CheckboxWidget(props: WidgetProps) {
  const { id, disabled, rawErrors, readonly, value, onChange, label, uiSchema } = props;

  const displayLabel = uiSchema?.['ui:title'] || label;
  const hasError = !!rawErrors?.length;
  const errorId = `${id}-error`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="w-full">
      <Checkbox
        id={id}
        checked={value ?? false}
        onChange={handleChange}
        disabled={!!(disabled || readonly)}
      >
        {displayLabel}
      </Checkbox>
      {hasError && (
        <div className="my-sm text-error" id={errorId}>
          <FormErrorMessage>{rawErrors[0]}</FormErrorMessage>
        </div>
      )}
    </div>
  );
}

export default CheckboxWidget;
