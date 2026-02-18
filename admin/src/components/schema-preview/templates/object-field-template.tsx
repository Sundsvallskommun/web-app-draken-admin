'use client';

import { ObjectFieldTemplateProps } from '@rjsf/utils';

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = ({
  title,
  description,
  properties,
  uiSchema,
  idSchema,
}) => {
  // Get ui:order from uiSchema
  const order = uiSchema?.['ui:order'] as string[] | undefined;

  // Sort properties according to ui:order if specified
  const sortedProperties = order
    ? [...properties].sort((a, b) => {
        const indexA = order.indexOf(a.name);
        const indexB = order.indexOf(b.name);
        // If not in order array, put at end (unless it's '*' which means rest)
        const posA = indexA === -1 ? (order.includes('*') ? order.indexOf('*') : order.length) : indexA;
        const posB = indexB === -1 ? (order.includes('*') ? order.indexOf('*') : order.length) : indexB;
        return posA - posB;
      })
    : properties;

  // Check if this is the root object (no parent id)
  const isRoot = !idSchema.$id || idSchema.$id === 'root';

  // Group properties by paired layout
  // Fields with "layout": "paired" in ui:options are grouped into 2-column grids
  const renderGroups: React.ReactNode[] = [];
  let pairedBuffer: typeof properties = [];

  const flushPairedBuffer = () => {
    if (pairedBuffer.length > 0) {
      renderGroups.push(
        <div key={`paired-${renderGroups.length}`} className="paired-layout grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
          {pairedBuffer.map(prop => (
            <div key={prop.name} className="field-wrapper">
              {prop.content}
            </div>
          ))}
        </div>
      );
      pairedBuffer = [];
    }
  };

  sortedProperties.forEach((prop) => {
    const fieldUiSchema = uiSchema?.[prop.name];
    const layout = fieldUiSchema?.['ui:options']?.layout as string | undefined;

    if (layout === 'paired') {
      pairedBuffer.push(prop);
      // Flush when we have 2 paired fields
      if (pairedBuffer.length === 2) {
        flushPairedBuffer();
      }
    } else {
      // Flush any pending paired fields before adding non-paired
      flushPairedBuffer();
      // Add non-paired field directly
      renderGroups.push(
        <div key={prop.name} className="field-wrapper">
          {prop.content}
        </div>
      );
    }
  });

  // Flush remaining paired fields
  flushPairedBuffer();

  return (
    <div className="object-field w-full">
      {!isRoot && title && <h4 className="text-lg font-semibold mb-4">{title}</h4>}
      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
      <div className="flex flex-col gap-6">
        {renderGroups}
      </div>
    </div>
  );
};

export default ObjectFieldTemplate;
