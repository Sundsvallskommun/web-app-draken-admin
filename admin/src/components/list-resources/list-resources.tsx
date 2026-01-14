import { defaultInformationFields } from '@config/defaults';
import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import { AutoTable, AutoTableHeader, Icon, useConfirm } from '@sk-web-gui/react';
import { getFormattedFields } from '@utils/formatted-field';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { Check, Pencil, Trash } from 'lucide-react';
import NextLink from 'next/link';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';
import { useShallow } from 'zustand/react/shallow';

interface ListResourcesProps {
  properties?: string[];
  resource: ResourceName;
  headers?: AutoTableHeader[];
  data?: Array<Record<string, unknown>>;
  editProperty?: string;
  filter?: string;
}

export const ListResources: React.FC<ListResourcesProps> = ({
  properties,
  resource,
  headers: _headers,
  data,
  editProperty = 'id',
  filter,
}) => {
  const { update, remove } = resources[resource];
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [{ [resource]: storeHeaders }, setHeaders] = useLocalStorage(
    useShallow((state) => [state.headers, state.setHeaders])
  );
  const { refresh } = useResource(resource as ResourceName);
  const { handleRemove } = useCrudHelper(resource);
  const { municipalityId } = useLocalStorage();

  const onRemove = (value: string) => {
    if (remove) {
      confirm
        .showConfirmation(
          capitalize(t('common:remove_resource', { resource: t(`${resource}:name_one`) })),
          capitalize(t('common:can_not_be_undone')),
          capitalize(t('common:remove')),
          capitalize(t('common:close')),
          'error'
        )
        .then((confirm) => {
          if (confirm) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handleRemove(() => remove?.(municipalityId, filter as any, value)).then((res) => {
              if (res) {
                refresh();
              }
            });
          }
        });
    }
  };

  useEffect(() => {
    if (!storeHeaders && data) {
      const newHeaders = properties ?? [
        ...(data?.[0] ? Object.keys(data[0]).filter((field) => typeof data[0][field] !== 'object') : []),
        ...(defaultInformationFields || ['id']),
      ];
      setHeaders({
        [resource]: newHeaders,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeHeaders, data, properties]);

  const headers = useMemo(
    () =>
      _headers ||
      storeHeaders?.reduce<AutoTableHeader[]>((headers, key) => {
        if (data) {
          const type = typeof data?.[0]?.[key];
          switch (type) {
            case 'string':
              return [
                ...headers,
                {
                  label: capitalize(
                    t(`${defaultInformationFields.includes(key) ? 'common:' : `${resource}:properties.`}${key}`)
                  ),
                  property: key,
                },
              ];
            case 'number':
              return [
                ...headers,
                {
                  label: capitalize(
                    t(`${defaultInformationFields.includes(key) ? 'common:' : `${resource}:properties.`}${key}`)
                  ),
                  property: key,
                },
              ];
            case 'boolean':
              return [
                ...headers,
                {
                  label: capitalize(
                    t(`${defaultInformationFields.includes(key) ? 'common:' : `${resource}:properties.`}${key}`)
                  ),
                  property: key,
                  renderColumn: (value) => (
                    <span>{value && <Icon.Padded rounded color="success" icon={<Check />} />}</span>
                  ),
                  isColumnSortable: false,
                },
              ];
            default:
              return headers;
          }
        } else {
          return headers;
        }
      }, []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeHeaders, _headers, data]
  );

  const editHeader: AutoTableHeader = {
    label: 'edit',
    property: editProperty,
    isColumnSortable: false,
    screenReaderOnly: true,
    sticky: true,
    renderColumn: (value) => (
      <div className="text-right w-full">
        <NextLink href={`/${resource}/${value}`} aria-label="Redigera">
          <Icon.Padded icon={<Pencil />} variant="tertiary" className="link-btn" />
        </NextLink>
      </div>
    ),
  };

  const removeHeader: AutoTableHeader = {
    label: 'remove',
    property: editProperty,
    isColumnSortable: false,
    screenReaderOnly: true,
    sticky: true,
    renderColumn: (value) => (
      <div className="text-right w-full">
        <Icon.Padded
          icon={<Trash />}
          variant="tertiary"
          className="link-btn cursor-pointer"
          onClick={() => onRemove(value)}
        />
      </div>
    ),
  };

  const translatedHeaders: AutoTableHeader[] =
    headers?.map((header) =>
      typeof header === 'object' ?
        { ...header, label: header?.label || capitalize(t(`${resource}:properties.${header}`)) }
      : {
          label: t(`${resource}:properties.${header}`, { defaultValue: header }),
          property: header,
        }
    ) || [];

  const formattedData = useMemo(() => data?.map((row) => getFormattedFields(row)), [data]);

  const autoHeaders = [
    ...translatedHeaders,
    ...(update ? [editHeader] : []),
    ...(resource === 'roles' || resource === 'statuses' ? [removeHeader] : []),
  ];

  return (
    <div>
      {formattedData && formattedData?.length > 0 ?
        <AutoTable
          pageSize={15}
          autodata={formattedData}
          autoheaders={autoHeaders.filter(
            (header, index) =>
              autoHeaders.map((head) => head.label).indexOf(header.label) === index &&
              Object.keys(formattedData[0]).includes(header.property as string)
          )}
        />
      : <h3>{capitalize(t('common:no_resources', { resources: t(`${resource}:name_zero`) }))}</h3>}
    </div>
  );
};
