'use client';

import Form from '@rjsf/core';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useState } from 'react';
import { skWebGuiTemplates } from './templates';
import { transformErrors } from './utils/error-transformer';
import { transformSchemaForPreview } from './utils/schema-transformer';
import { skWebGuiWidgets } from './widgets';

interface SchemaPreviewProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
}

export const SchemaPreview: React.FC<SchemaPreviewProps> = ({ schema, uiSchema = {} }) => {
  const { t } = useTranslation('jsonSchemas');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering for Form
  useEffect(() => {
    setMounted(true);
  }, []);

  // Transform schema for preview - handles conditional field visibility
  // This converts allOf/if/then conditions to RJSF-compatible format
  const previewSchema = useMemo(() => transformSchemaForPreview(schema), [schema]);

  // Check if schema is valid
  const hasValidSchema = schema && typeof schema === 'object' && Object.keys(schema).length > 0;

  if (!hasValidSchema) {
    return (
      <div className="p-8 text-center text-gray-500 border border-dashed border-divider rounded">
        {t('preview.no_schema')}
      </div>
    );
  }

  if (!mounted) {
    return <div className="p-8 text-center text-gray-500">Laddar förhandsgranskning...</div>;
  }

  return (
    <div className="schema-preview">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="preview-form bg-background-color-mixin-1 p-6 rounded border border-divider">
          <Form
            schema={previewSchema}
            uiSchema={uiSchema}
            validator={validator}
            formData={formData}
            onChange={(e) => setFormData(e.formData || {})}
            onSubmit={() => {}}
            widgets={skWebGuiWidgets}
            templates={skWebGuiTemplates}
            transformErrors={transformErrors}
            showErrorList={false}
            noHtml5Validate
            omitExtraData
          >
            <div>{/* Hide default submit button */}</div>
          </Form>
        </div>

        <div className="preview-data">
          <h4 className="font-medium mb-2">{t('preview.form_data')}</h4>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SchemaPreview;
