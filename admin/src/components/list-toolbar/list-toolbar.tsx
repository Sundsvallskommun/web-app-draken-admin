import { defaultInformationFields } from '@config/defaults';
import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import { Button, Checkbox, Icon, PopupMenu, useSnackbar } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { readTemplateFile, TemplateExport } from '@utils/template-export-import';
import { FilePlus2, RefreshCcw, Settings, Upload } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';
import { useShallow } from 'zustand/react/shallow';

interface ListToolbarProps {
  resource: ResourceName;
  onRefresh?: () => void;
  properties?: string[];
  onImportTemplate?: (data: TemplateExport) => void;
}

export const ListToolbar: React.FC<ListToolbarProps> = ({ onRefresh, resource, properties, onImportTemplate }) => {
  const { t } = useTranslation();
  const snackbar = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ [resource]: headers }, setHeaders] = useLocalStorage(
    useShallow((state) => [state.headers, state.setHeaders])
  );
  const { watch, register, reset } = useForm<{ headers: string[] }>({ defaultValues: { headers } });
  const { create } = resources[resource];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportTemplate) {
      const data = await readTemplateFile(file);
      if (data) {
        onImportTemplate(data);
      } else {
        snackbar({
          message: capitalize(t('templates:import_invalid_file')),
          status: 'error',
        });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedHeaders = watch('headers');

  useEffect(() => {
    reset({ headers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  useEffect(() => {
    if (!selectedHeaders) {
      reset({ headers });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers]);

  useEffect(() => {
    if (properties && setHeaders && selectedHeaders) {
      if (headers?.join() !== selectedHeaders?.join()) {
        setHeaders({ [resource]: selectedHeaders });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHeaders, properties, setHeaders]);

  return (
    <Button.Group className="absolute top-16 right-0 w-fit z-10">
      {!!create && (
        <Link
          href={`/${resource}/new`}
          className="sk-btn sk-btn-sm sk-btn-tertiary"
          data-icon={true}
          data-background={false}
          aria-label={capitalize(t('common:create_new', { resource: t(`${resource}:name_one`) }))}
        >
          <Icon icon={<FilePlus2 />} />
        </Link>
      )}
      {resource === 'templates' && onImportTemplate && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            iconButton
            variant="tertiary"
            aria-label={capitalize(t('templates:import_template'))}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon icon={<Upload />} />
          </Button>
        </>
      )}
      {!!onRefresh && (
        <Button iconButton variant="tertiary" aria-label={capitalize(t('common:refresh'))} onClick={() => onRefresh()}>
          <Icon icon={<RefreshCcw />} />
        </Button>
      )}
      {properties && headers && (
        <span className="relative">
          <PopupMenu position="under" align="end">
            <PopupMenu.Button
              variant="tertiary"
              showBackground={false}
              size="sm"
              iconButton
              leftIcon={<Settings />}
            ></PopupMenu.Button>
            <PopupMenu.Panel>
              <PopupMenu.Items>
                {properties.map((prop, index) => (
                  <PopupMenu.Item key={`tab-prop-${index}`}>
                    <Checkbox labelPosition="left" value={prop} {...register('headers')}>
                      {capitalize(
                        t(`${defaultInformationFields.includes(prop) ? 'common:' : `${resource}:properties.`}${prop}`)
                      )}
                    </Checkbox>
                  </PopupMenu.Item>
                ))}
              </PopupMenu.Items>
            </PopupMenu.Panel>
          </PopupMenu>
        </span>
      )}
    </Button.Group>
  );
};
