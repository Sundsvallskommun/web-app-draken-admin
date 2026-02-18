import { JsonEditor } from '@components/json-editor/json-editor';
import { Resource } from '@interfaces/resource';
import { FormControl, FormLabel, Input, RadioButton, Textarea } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';
const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

interface EditResourceProps {
  isNew?: boolean;
}

export const EditResourceTemplate: React.FC<EditResourceProps> = ({ isNew }) => {
  type CreateType = Parameters<NonNullable<Resource<FieldValues>['create']>>[1];
  type UpdateType = Parameters<NonNullable<Resource<FieldValues>['update']>>[2];
  type DataType = CreateType | UpdateType;

  const { t } = useTranslation();

  const isInitialized = useRef(false);

  const { register, watch, setValue } = useFormContext<DataType>();

  const { content, metadata, defaultValues } = watch();

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
        <Input {...register('identifier')} readOnly={!isNew} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.name`))}</FormLabel>
        <Input {...register('name')} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.description`))}</FormLabel>
        <Input {...register('description')} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.changeLog`))}</FormLabel>
        <Input {...register('changeLog')} className="w-[53rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.content`))}</FormLabel>
        {hasRichTextEditor ?
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
        : <Textarea {...register('content')} rows={25} className="w-[130rem]" />}
      </FormControl>
      <FormControl className="w-full">
        <FormLabel>{capitalize(t(`templates:properties.metadata`))}</FormLabel>
        <JsonEditor value={parsedMetadata} onChange={handleMetadataChange} height="400px" />
      </FormControl>
      <FormControl className="w-full">
        <FormLabel>{capitalize(t(`templates:properties.defaultValues`))}</FormLabel>
        <JsonEditor value={parsedDefaultValues} onChange={handleDefaultValuesChange} height="400px" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.versionIncrement`))}</FormLabel>
        <RadioButton.Group inline>
          <RadioButton value={'MINOR'} defaultChecked {...register('versionIncrement')}>
            Minor
          </RadioButton>
          <RadioButton value={'MAJOR'} {...register('versionIncrement')}>
            Major
          </RadioButton>
        </RadioButton.Group>
      </FormControl>
    </div>
  );
};
