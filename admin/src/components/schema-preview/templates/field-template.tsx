'use client';

import { FieldTemplateProps } from '@rjsf/utils';
import { FormControl, FormLabel } from '@sk-web-gui/react';

export const FieldTemplate: React.FC<FieldTemplateProps> = ({
  children,
  hidden,
  uiSchema,
  schema,
  label,
  required,
  displayLabel,
  id,
  disabled,
  readonly,
}) => {
  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  const className = (uiSchema?.['ui:options']?.className as string) || '';
  const hideLabel = uiSchema?.['ui:options']?.hideLabel ?? false;
  const descriptionBelow = uiSchema?.['ui:options']?.descriptionBelow ?? false;
  const customLabel = uiSchema?.['ui:title'] as string | undefined;
  const finalLabel = customLabel || label;

  // Get description from ui:description or schema description
  const customDescription = uiSchema?.['ui:description'] as string | undefined;
  const schemaDescription = schema?.description as string | undefined;
  const descriptionText = customDescription || schemaDescription;

  // Only checkbox handles its own label inline - radiobuttons need a group label
  const widget = uiSchema?.['ui:widget'] as string | undefined;
  const isCheckbox = widget === 'checkbox' || widget === 'CheckboxWidget';

  const renderDescription = () => {
    if (!descriptionText) return null;
    // Check if description contains HTML
    if (descriptionText.includes('<')) {
      return (
        <div
          className="text-sm text-tertiary mb-2"
          dangerouslySetInnerHTML={{ __html: descriptionText }}
        />
      );
    }
    return <p className="text-sm text-tertiary mb-2">{descriptionText}</p>;
  };

  return (
    <div className={`mb-4 w-full ${className}`.trim()}>
      <FormControl required={required} disabled={disabled || readonly} className="w-full">
        {displayLabel && !hideLabel && !isCheckbox && finalLabel && (
          <FormLabel htmlFor={id}>{finalLabel}</FormLabel>
        )}
        {!descriptionBelow && renderDescription()}
        {children}
        {descriptionBelow && renderDescription()}
      </FormControl>
    </div>
  );
};

export default FieldTemplate;
