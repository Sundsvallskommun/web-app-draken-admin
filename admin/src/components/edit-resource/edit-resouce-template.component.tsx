import { JsonEditor } from '@components/json-editor/json-editor';
import { Resource } from '@interfaces/resource';
import { Checkbox, FormControl, FormLabel, Input, RadioButton, Select, Textarea } from '@sk-web-gui/react';
import { getMetadataValue } from '@utils/template-metadata';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';
const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

const TEMPLATE_TYPES = ['email', 'sms', 'decision', 'investigation'];

interface EditResourceProps {
  isNew?: boolean;
  isApproved?: boolean;
}

export const EditResourceTemplate: React.FC<EditResourceProps> = ({ isNew, isApproved }) => {
  type CreateType = Parameters<NonNullable<Resource<FieldValues>['create']>>[1];
  type UpdateType = Parameters<NonNullable<Resource<FieldValues>['update']>>[2];
  type DataType = CreateType | UpdateType;

  const { t } = useTranslation();

  const isInitialized = useRef(false);

  const { register, watch, setValue } = useFormContext<DataType>();

  const { content, metadata, defaultValues } = watch();

  const getMetadata = useCallback(
    (key: string) => getMetadataValue(metadata, key) ?? '',
    [metadata]
  );

  const setMetadataEntry = useCallback(
    (key: string, value: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let metadataArray: any[] = [];
      if (typeof metadata === 'string') {
        try {
          metadataArray = JSON.parse(metadata || '[]');
        } catch {
          metadataArray = [];
        }
      } else if (Array.isArray(metadata)) {
        metadataArray = [...metadata];
      }

      const filtered = metadataArray.filter((item) => item.key !== key);
      if (value) {
        filtered.push({ key, value });
      }
      setValue('metadata', JSON.stringify(filtered, null, 2), { shouldDirty: true });
    },
    [metadata, setValue]
  );

  const currentTemplateType = useMemo(() => getMetadata('templateType'), [getMetadata]);
  const currentNamespace = useMemo(() => getMetadata('namespace'), [getMetadata]);
  const currentEditor = useMemo(() => getMetadata('editor'), [getMetadata]);

  useEffect(() => {
    if (!getMetadata('application')) {
      setMetadataEntry('application', 'draken');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customType, setCustomType] = useState(
    () => currentTemplateType !== '' && !TEMPLATE_TYPES.includes(currentTemplateType.toLowerCase())
  );

  // Parse metadata for JsonEditor
  const parsedMetadata = useMemo(() => {
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata || '[]');
      } catch {
        return [];
      }
    }
    return metadata || [];
  }, [metadata]);

  // Parse defaultValues for JsonEditor
  const parsedDefaultValues = useMemo(() => {
    if (typeof defaultValues === 'string') {
      try {
        return JSON.parse(defaultValues || '{}');
      } catch {
        return {};
      }
    }
    return defaultValues || {};
  }, [defaultValues]);

  const handleMetadataChange = useCallback(
    (value: Record<string, unknown>) => {
      setValue('metadata', JSON.stringify(value, null, 2), { shouldDirty: true });
    },
    [setValue]
  );

  const handleDefaultValuesChange = useCallback(
    (value: Record<string, unknown>) => {
      setValue('defaultValues', JSON.stringify(value, null, 2), { shouldDirty: true });
    },
    [setValue]
  );

  const hasRichTextEditor = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let metadataArray: any[] = [];
    if (typeof metadata === 'string') {
      try {
        metadataArray = JSON.parse(metadata);
      } catch {
        return false;
      }
    } else if (Array.isArray(metadata)) {
      metadataArray = metadata;
    } else {
      return false;
    }
    return metadataArray.some((item) => item.key === 'editor' && item.value === 'richtexteditor');
  }, [metadata]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <FormControl required>
        <FormLabel>{capitalize(t(`templates:properties.identifier`))}</FormLabel>
        <Input {...register('identifier')} readOnly={!isNew || isApproved} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.name`))}</FormLabel>
        <Input {...register('name')} readOnly={isApproved} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.description`))}</FormLabel>
        <Input {...register('description')} readOnly={isApproved} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>Malltyp</FormLabel>
        <Select
          className="w-[53rem]"
          disabled={isApproved}
          value={customType ? '__custom__' : currentTemplateType.toLowerCase()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__custom__') {
              setCustomType(true);
              setMetadataEntry('templateType', '');
            } else {
              setCustomType(false);
              setMetadataEntry('templateType', val);
            }
          }}
        >
          <Select.Option value="">Ingen</Select.Option>
          {TEMPLATE_TYPES.map((type) => (
            <Select.Option value={type} key={type}>
              {capitalize(type)}
            </Select.Option>
          ))}
          <Select.Option value="__custom__">Annan...</Select.Option>
        </Select>
        {customType && (
          <Input
            className="w-[53rem]"
            placeholder="Ange malltyp"
            readOnly={isApproved}
            value={currentTemplateType}
            onChange={(e) => setMetadataEntry('templateType', e.target.value)}
          />
        )}
      </FormControl>
      <FormControl>
        <FormLabel>Namespace</FormLabel>
        <Input
          className="w-[53rem]"
          readOnly={isApproved}
          value={currentNamespace}
          onChange={(e) => setMetadataEntry('namespace', e.target.value)}
        />
      </FormControl>
      <FormControl>
        <Checkbox
          disabled={isApproved}
          checked={currentEditor === 'richtexteditor'}
          onChange={(e) => setMetadataEntry('editor', e.target.checked ? 'richtexteditor' : '')}
        >
          Aktivera texteditor
        </Checkbox>
        <span className="text-small text-tertiary">
          Aktivera för att använda en visuell texteditor istället för vanligt textfält för mallinnehållet.
        </span>
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.changeLog`))}</FormLabel>
        <Input {...register('changeLog')} readOnly={isApproved} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.content`))}</FormLabel>
        {hasRichTextEditor ?
          <div className={isApproved ? 'pointer-events-none opacity-70' : ''}>
            <TextEditor
              className="w-[130rem] h-[61.6rem] mb-[5rem]"
              onChange={(e) => {
                setValue('content', e.target.value.markup, {
                  shouldDirty: isInitialized.current,
                });
                isInitialized.current = true;
              }}
              value={{ markup: content }}
            />
          </div>
        : <Textarea {...register('content')} readOnly={isApproved} rows={25} className="w-[130rem]" />}
      </FormControl>
      <FormControl className="w-full">
        <FormLabel>{capitalize(t(`templates:properties.metadata`))}</FormLabel>
        <JsonEditor value={parsedMetadata} onChange={handleMetadataChange} height="400px" readOnly={isApproved} />
      </FormControl>
      <FormControl className="w-full">
        <FormLabel>{capitalize(t(`templates:properties.defaultValues`))}</FormLabel>
        <JsonEditor value={parsedDefaultValues} onChange={handleDefaultValuesChange} height="400px" readOnly={isApproved} />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.versionIncrement`))}</FormLabel>
        <RadioButton.Group inline>
          <RadioButton value={'MINOR'} defaultChecked {...register('versionIncrement')} disabled={isApproved}>
            Minor
          </RadioButton>
          <RadioButton value={'MAJOR'} {...register('versionIncrement')} disabled={isApproved}>
            Major
          </RadioButton>
        </RadioButton.Group>
      </FormControl>
    </div>
  );
};
