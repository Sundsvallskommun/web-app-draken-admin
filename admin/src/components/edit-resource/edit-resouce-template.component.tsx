import { Resource } from '@interfaces/resource';
import { FormControl, FormLabel, Input, RadioButton, Textarea } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';
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

  const { content, metadata } = watch();

  const hasRichTextEditor = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedMetadata: any[] = [];
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        return false;
      }
    } else if (Array.isArray(metadata)) {
      parsedMetadata = metadata;
    } else {
      return false;
    }
    return parsedMetadata.some((item) => item.key === 'editor' && item.value === 'richtexteditor');
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
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.metadata`))}</FormLabel>
        <Textarea {...register('metadata')} rows={25} className="w-[130rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t(`templates:properties.defaultValues`))}</FormLabel>
        <Textarea {...register('defaultValues')} rows={25} className="w-[130rem]" />
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
