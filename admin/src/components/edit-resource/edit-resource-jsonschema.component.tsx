import { JsonEditor } from '@components/json-editor/json-editor';
import { SchemaBuilder } from '@components/schema-builder';
import { SchemaPreview } from '@components/schema-preview/schema-preview';
import { UiSchema } from '@interfaces/jsonschema';
import { Button, FormControl, FormLabel, Input, RadioButton, Spinner, Textarea } from '@sk-web-gui/react';
import { useSnackbar } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

interface EditResourceJsonSchemaProps {
  isNew?: boolean;
  schemaId?: string;
}

type TabType = 'builder' | 'json_schema' | 'ui_schema' | 'preview';
type VersionIncrement = 'MINOR' | 'MAJOR';

export const EditResourceJsonSchema: React.FC<EditResourceJsonSchemaProps> = ({ isNew, schemaId }) => {
  const { t } = useTranslation('jsonSchemas');
  const { register, watch, setValue } = useFormContext();
  const { municipalityId } = useLocalStorage();
  const snackbar = useSnackbar();

  const [activeTab, setActiveTab] = useState<TabType>('builder');
  const [uiSchema, setUiSchema] = useState<Record<string, unknown>>({});
  const [uiSchemaLoading, setUiSchemaLoading] = useState(false);
  const [uiSchemaLoaded, setUiSchemaLoaded] = useState(false);
  const [uiSchemaSaving, setUiSchemaSaving] = useState(false);
  const [versionIncrement, setVersionIncrement] = useState<VersionIncrement>('MINOR');

  const schemaValue = watch('value');
  const currentVersion = watch('version');

  // Parse schema value with memoization to prevent infinite re-renders
  const parsedSchema = useMemo(() => {
    if (typeof schemaValue === 'string') {
      try {
        return JSON.parse(schemaValue || '{}');
      } catch {
        return {};
      }
    }
    return schemaValue || {};
  }, [schemaValue]);

  // Load UI Schema when editing existing schema
  useEffect(() => {
    if (!isNew && schemaId && !uiSchemaLoaded) {
      setUiSchemaLoading(true);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${schemaId}/ui-schema`,
        {
          credentials: 'include',
        }
      )
        .then(res => res.json())
        .then((data: { data: UiSchema | null }) => {
          if (data.data?.value) {
            setUiSchema(data.data.value);
          }
          setUiSchemaLoaded(true);
          setUiSchemaLoading(false);
        })
        .catch(() => {
          setUiSchemaLoaded(true);
          setUiSchemaLoading(false);
        });
    }
  }, [isNew, schemaId, municipalityId, uiSchemaLoaded]);

  const handleSchemaChange = useCallback(
    (newValue: Record<string, unknown>) => {
      setValue('value', newValue, { shouldDirty: true });
    },
    [setValue]
  );

  const handleUiSchemaChange = useCallback(
    (newValue: Record<string, unknown>) => {
      setUiSchema(newValue);
    },
    []
  );

  const handleSaveUiSchema = async () => {
    if (!schemaId) return;

    setUiSchemaSaving(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${schemaId}/ui-schema`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: uiSchema }),
        }
      );
      snackbar({
        message: t('messages.ui_schema_saved'),
        status: 'success',
      });
    } catch {
      snackbar({
        message: t('messages.error'),
        status: 'error',
      });
    } finally {
      setUiSchemaSaving(false);
    }
  };

  const handleDeleteUiSchema = async () => {
    if (!schemaId) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${schemaId}/ui-schema`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      setUiSchema({});
      snackbar({
        message: t('messages.ui_schema_deleted'),
        status: 'success',
      });
    } catch {
      snackbar({
        message: t('messages.error'),
        status: 'error',
      });
    }
  };

  // Calculate next version based on increment type
  const getNextVersion = useCallback(
    (increment: VersionIncrement) => {
      if (!currentVersion || isNew) return currentVersion || '1.0';
      const [major, minor] = currentVersion.split('.').map(Number);
      if (increment === 'MAJOR') {
        return `${major + 1}.0`;
      }
      return `${major}.${minor + 1}`;
    },
    [currentVersion, isNew]
  );

  // Update version when increment type changes
  useEffect(() => {
    if (!isNew && currentVersion) {
      const nextVersion = getNextVersion(versionIncrement);
      setValue('newVersion', nextVersion, { shouldDirty: false });
    }
  }, [versionIncrement, currentVersion, isNew, getNextVersion, setValue]);

  const tabs: { id: TabType; label: string; disabled?: boolean }[] = [
    { id: 'builder', label: t('tabs.builder', 'Byggare') },
    { id: 'preview', label: t('tabs.preview') },
    { id: 'json_schema', label: t('tabs.json_schema') },
    { id: 'ui_schema', label: t('tabs.ui_schema'), disabled: isNew },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Basic metadata fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormControl required className="w-[48rem]">
          <FormLabel>{capitalize(t('properties.name'))}</FormLabel>
          <Input {...register('name')} readOnly={!isNew} />
        </FormControl>

        {isNew ? (
          <FormControl required>
            <FormLabel>{capitalize(t('properties.version'))}</FormLabel>
            <Input {...register('version')} className="w-full" placeholder="1.0" />
          </FormControl>
        ) : (
          <FormControl>
            <FormLabel>{t('version_increment.label')}</FormLabel>
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                {t('version_increment.current')}: <strong>{currentVersion}</strong> → {t('version_increment.new')}:{' '}
                <strong>{getNextVersion(versionIncrement)}</strong>
              </div>
              <RadioButton.Group inline>
                <RadioButton
                  value="MINOR"
                  checked={versionIncrement === 'MINOR'}
                  onChange={() => setVersionIncrement('MINOR')}
                >
                  Minor ({currentVersion} → {getNextVersion('MINOR')})
                </RadioButton>
                <RadioButton
                  value="MAJOR"
                  checked={versionIncrement === 'MAJOR'}
                  onChange={() => setVersionIncrement('MAJOR')}
                >
                  Major ({currentVersion} → {getNextVersion('MAJOR')})
                </RadioButton>
              </RadioButton.Group>
            </div>
          </FormControl>
        )}
      </div>

      <FormControl className='w-full'>
        <FormLabel>{capitalize(t('properties.description'))}</FormLabel>
        <Textarea {...register('description')} rows={2} className='w-full' />
      </FormControl>

      {/* Hidden field for version increment */}
      <input type="hidden" {...register('versionIncrement')} value={versionIncrement} />

      {/* Tab navigation */}
      <div className="flex gap-12 border-b border-divider pb-12">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab content - use calc to fill remaining viewport height */}
      {/* Offset accounts for: header (~64px), padding, metadata fields (~200px), tabs (~50px), margins */}
      <div className="pt-12">
        {activeTab === 'builder' && (
          <div>
            <SchemaBuilder
              schema={parsedSchema}
              uiSchema={uiSchema}
              onSchemaChange={handleSchemaChange}
              onUiSchemaChange={handleUiSchemaChange}
              height="calc(100vh - 480px)"
            />
          </div>
        )}

        {activeTab === 'json_schema' && (
          <div>
            <JsonEditor value={parsedSchema} onChange={handleSchemaChange} height="calc(100vh - 480px)" />
          </div>
        )}

        {activeTab === 'ui_schema' && (
          <div>
            {uiSchemaLoading ? (
              <div className="flex items-center justify-center h-64">
                <Spinner size={8} />
              </div>
            ) : (
              <>
                <JsonEditor value={uiSchema} onChange={setUiSchema} height="calc(100vh - 530px)" />
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" onClick={handleSaveUiSchema} disabled={uiSchemaSaving} loading={uiSchemaSaving}>
                    {t('ui_schema.save')}
                  </Button>
                  {Object.keys(uiSchema).length > 0 && (
                    <Button variant="tertiary" color="error" onClick={handleDeleteUiSchema}>
                      {t('ui_schema.delete')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <SchemaPreview schema={parsedSchema} uiSchema={uiSchema} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditResourceJsonSchema;
