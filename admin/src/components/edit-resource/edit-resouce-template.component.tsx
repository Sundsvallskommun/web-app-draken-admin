import {
  APPLICATION_VALUE,
  CAPACITIES,
  CAPACITY_LABELS,
  FACET_KEYS,
  findSelectionRule,
  OUTCOME_LABELS,
  OUTCOMES,
  Process,
  PROCESS_LABELS,
  PROCESSES,
  TEMPLATE_TYPE_METADATA,
  TemplateKind,
} from '@config/template-schema';
import { JsonEditor } from '@components/json-editor/json-editor';
import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { Resource } from '@interfaces/resource';
import { Checkbox, FormControl, FormLabel, Input, Link, RadioButton, Select, Textarea } from '@sk-web-gui/react';
import { getMetadataValue } from '@utils/template-metadata';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';
const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

const TEMPLATE_TYPES = ['Email', 'Sms', 'Decision', 'Investigation'];

interface EditResourceProps {
  isNew?: boolean;
  isApproved?: boolean;
}

export const EditResourceTemplate: React.FC<EditResourceProps> = ({ isNew, isApproved }) => {
  type CreateType = Parameters<NonNullable<Resource<FieldValues>['create']>>[1];
  type UpdateType = Parameters<NonNullable<Resource<FieldValues>['update']>>[2];
  type DataType = CreateType | UpdateType;

  const { t } = useTranslation();

  const { municipalityId } = useLocalStorage();

  const isInitialized = useRef(false);

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);

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

  // Apply several metadata entries atomically (a single read+write), so chained updates
  // don't clobber each other the way repeated setMetadataEntry calls would.
  const setMetadataEntries = useCallback(
    (entries: { key: string; value: string }[]) => {
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

      for (const { key, value } of entries) {
        metadataArray = metadataArray.filter((item) => item.key !== key);
        if (value) {
          metadataArray.push({ key, value });
        }
      }
      setValue('metadata', JSON.stringify(metadataArray, null, 2), { shouldDirty: true });
    },
    [metadata, setValue]
  );

  const currentTemplateType = useMemo(() => getMetadata('templateType'), [getMetadata]);
  const currentNamespace = useMemo(() => getMetadata('namespace'), [getMetadata]);
  const currentEditor = useMemo(() => getMetadata('editor'), [getMetadata]);

  useEffect(() => {
    const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
    apiService.namespaceControllerGetNamespaces(municipalityId).then((res) => {
      setNamespaces(res.data.data);
    });
  }, [municipalityId]);

  // Preserve a previously saved namespace that isn't in the fetched list (e.g. legacy
  // free-text values) so switching to a Select can't silently drop it.
  const namespaceOptions = useMemo(() => {
    const options = namespaces.map((ns) => ({
      value: ns.namespace,
      label: `${ns.displayName} (${ns.namespace})`,
    }));
    if (currentNamespace && !namespaces.some((ns) => ns.namespace === currentNamespace)) {
      options.unshift({ value: currentNamespace, label: currentNamespace });
    }
    return options;
  }, [namespaces, currentNamespace]);

  // ── Selection facets ───────────────────────────────────────────────────────
  // For decision/investigation templates, admin picks process + the facets the schema
  // requires, which generate the routing metadata automatically (no manual key/value).
  const templateKind: TemplateKind | null =
    currentTemplateType === TEMPLATE_TYPE_METADATA.DECISION
      ? 'DECISION'
      : currentTemplateType === TEMPLATE_TYPE_METADATA.INVESTIGATION
      ? 'INVESTIGATION'
      : null;
  const currentProcess = getMetadata(FACET_KEYS.process) as Process | '';
  const selectionRule =
    templateKind && currentProcess ? findSelectionRule(templateKind, currentProcess) : undefined;

  // Raw JSON metadata editing is locked by default so nobody fiddles with the routing
  // facets by hand; unlock only for informational metadata / special cases.
  const [metadataUnlocked, setMetadataUnlocked] = useState(false);

  const handleProcessChange = useCallback(
    (value: Process | '') => {
      const rule = templateKind && value ? findSelectionRule(templateKind, value) : undefined;
      const entries: { key: string; value: string }[] = [{ key: FACET_KEYS.process, value }];
      // Clear facets that the new process no longer requires, to avoid stale routing.
      (['decision', 'capacity'] as const).forEach((facet) => {
        if (!rule?.requiredFacets.includes(facet)) {
          entries.push({ key: FACET_KEYS[facet], value: '' });
        }
      });
      setMetadataEntries(entries);
    },
    [templateKind, setMetadataEntries]
  );

  // Selection facets only apply to Decision/Investigation; clear stale process/decision/capacity
  // when the template type changes so a previous routing key can't linger on the wrong type.
  const handleTemplateTypeChange = useCallback(
    (value: string) => {
      setMetadataEntries([
        { key: FACET_KEYS.templateType, value },
        { key: FACET_KEYS.process, value: '' },
        { key: FACET_KEYS.decision, value: '' },
        { key: FACET_KEYS.capacity, value: '' },
      ]);
    },
    [setMetadataEntries]
  );

  useEffect(() => {
    if (!getMetadata(FACET_KEYS.application)) {
      setMetadataEntry(FACET_KEYS.application, APPLICATION_VALUE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [customType, setCustomType] = useState(
    () => currentTemplateType !== '' && !TEMPLATE_TYPES.includes(currentTemplateType)
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
          value={customType ? '__custom__' : currentTemplateType}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '__custom__') {
              setCustomType(true);
              handleTemplateTypeChange('');
            } else {
              setCustomType(false);
              handleTemplateTypeChange(val);
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
      {templateKind && (
        <div className="flex flex-col gap-12 rounded border-1 border-gray-200 p-16">
          <div>
            <FormLabel>Selektering</FormLabel>
            <p className="text-small text-tertiary">
              Dessa val genererar mallens metadata automatiskt så den kan väljas utifrån ärendet. Ingen manuell
              redigering behövs.
            </p>
          </div>
          <FormControl>
            <FormLabel>Process</FormLabel>
            <Select
              className="w-[53rem]"
              disabled={isApproved}
              value={currentProcess}
              onChange={(e) => handleProcessChange(e.target.value as Process | '')}
            >
              <Select.Option value="">Välj process</Select.Option>
              {PROCESSES.map((process) => (
                <Select.Option value={process} key={process}>
                  {PROCESS_LABELS[process]}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          {selectionRule?.requiredFacets.includes('decision') && (
            <FormControl>
              <FormLabel>Beslutsutfall</FormLabel>
              <Select
                className="w-[53rem]"
                disabled={isApproved}
                value={getMetadata(FACET_KEYS.decision)}
                onChange={(e) => setMetadataEntry(FACET_KEYS.decision, e.target.value)}
              >
                <Select.Option value="">Välj utfall</Select.Option>
                {OUTCOMES.map((outcome) => (
                  <Select.Option value={outcome} key={outcome}>
                    {OUTCOME_LABELS[outcome]}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          )}
          {selectionRule?.requiredFacets.includes('capacity') && (
            <FormControl>
              <FormLabel>Kapacitet</FormLabel>
              <Select
                className="w-[53rem]"
                disabled={isApproved}
                value={getMetadata(FACET_KEYS.capacity)}
                onChange={(e) => setMetadataEntry(FACET_KEYS.capacity, e.target.value)}
              >
                <Select.Option value="">Välj kapacitet</Select.Option>
                {CAPACITIES.map((capacity) => (
                  <Select.Option value={capacity} key={capacity}>
                    {CAPACITY_LABELS[capacity]}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
      )}
      <FormControl>
        <FormLabel>Namespace</FormLabel>
        <Select
          className="w-[53rem]"
          disabled={isApproved}
          value={currentNamespace}
          onChange={(e) => setMetadataEntry('namespace', e.target.value)}
        >
          <Select.Option value="">Välj ett alternativ</Select.Option>
          {namespaceOptions.map((option) => (
            <Select.Option value={option.value} key={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        {!isApproved && (
          <span className="text-small text-tertiary">
            Saknas namespacet?{' '}
            <Link href="/namespaces/new" target="_blank">
              Lägg till ett nytt namespace
            </Link>
          </span>
        )}
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
        <div className="flex w-full items-center justify-between">
          <FormLabel>{capitalize(t(`templates:properties.metadata`))}</FormLabel>
          {!isApproved && (
            <Checkbox checked={metadataUnlocked} onChange={(e) => setMetadataUnlocked(e.target.checked)}>
              Redigera metadata manuellt
            </Checkbox>
          )}
        </div>
        <p className="text-small text-tertiary">
          Selekteringsfacetter (process, utfall, kapacitet) sätts via fälten ovan. Lås upp endast för
          informationsmetadata eller specialfall.
        </p>
        <JsonEditor
          value={parsedMetadata}
          onChange={handleMetadataChange}
          height="400px"
          readOnly={isApproved || !metadataUnlocked}
        />
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
