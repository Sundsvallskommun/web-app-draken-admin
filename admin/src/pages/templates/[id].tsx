import { EditResourceTemplate } from '@components/edit-resource/edit-resouce-template.component';
import { EditorToolbar } from '@components/editor-toolbar/editor-toolbar';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { defaultInformationFields } from '@config/defaults';
import resources from '@config/resources';
import { Resource, ResourceResponse } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import EditLayout from '@layouts/edit-layout/edit-layout.component';
import { getFormattedFields } from '@utils/formatted-field';
import { useRouteGuard } from '@utils/routeguard.hook';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { isTemplateApproved, getApprovalTimestamp, TEST_STATUS_KEY, TEST_APPROVED_AT_KEY, TEST_STATUS_APPROVED } from '@utils/template-metadata';
import { Icon } from '@sk-web-gui/react';
import { ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { capitalize } from 'underscore.string';

export const EditTemplates: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { municipalityId } = useLocalStorage();

  const { id: _id } = useParams();
  const resource = 'templates';

  const { create, update, getOne, defaultValues } = resources[resource as ResourceName];
  const { refresh } = useResource(resource as ResourceName);

  const { handleGetOne, handleCreate, handleUpdate } = useCrudHelper(resource as ResourceName);

  type CreateType = Parameters<NonNullable<Resource<FieldValues>['create']>>[1];
  type UpdateType = Parameters<NonNullable<Resource<FieldValues>['update']>>[2];
  type DataType = CreateType | UpdateType;

  const form = useForm<DataType>({
    defaultValues: defaultValues,
  });
  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const id = _id === 'new' ? undefined : _id;

  const [loaded, setLoaded] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(!id);
  const [navigate, setNavigate] = useState<boolean>(false);

  const formdata = getFormattedFields(watch());

  useRouteGuard(isDirty);

  useEffect(() => {
    setNavigate(false);
    if (id) {
      setIsNew(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && getOne) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleGetOne<any>(() => getOne(municipalityId, id as any)).then((res) => {
        reset(res);
        setIsNew(false);
        setLoaded(true);
      });
    } else {
      reset(defaultValues);
      setIsNew(true);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (navigate) {
      router.push(`/${resource}/${formdata?.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (formdata.id && isNew && !isDirty) {
      setNavigate(true);
    }
  }, [formdata?.id, isNew, isDirty]);

  const metadata = watch('metadata');
  const isApproved = useMemo(() => isTemplateApproved(metadata), [metadata]);
  const approvedAt = useMemo(() => getApprovalTimestamp(metadata), [metadata]);

  const onSubmit = useCallback((data: DataType) => {
    // Only send fields the API expects — extra fields from getOne (version, type, lastModifiedAt) cause 500
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any;
    const cleanData = {
      identifier: d.identifier,
      name: d.name,
      description: d.description,
      content: d.content,
      metadata: d.metadata,
      defaultValues: d.defaultValues,
      versionIncrement: d.versionIncrement,
      changeLog: d.changeLog,
    };

    const createFunc: (municipalityId: number, data: DataType) => ReturnType<NonNullable<Resource<FieldValues>['create']>> =
      create as NonNullable<Resource<FieldValues>['create']>;
    switch (isNew) {
      case true:
        handleCreate(() => createFunc(municipalityId, cleanData as CreateType)).then((res) => {
          if (res) {
            reset(res);
            refresh();
          }
        });

        break;
      case false:
        if (id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handleUpdate(() => update?.(municipalityId, id as any, cleanData) as ResourceResponse<Partial<FieldValues>>).then((res) => {
            reset(res?.data);
            refresh();
          });
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, id, municipalityId, create, update, reset, refresh, handleCreate, handleUpdate]);

  const parseMetadataArray = useCallback((): Array<{ key: string; value: string }> => {
    const current = form.getValues('metadata');
    if (typeof current === 'string') {
      try {
        return JSON.parse(current || '[]');
      } catch {
        return [];
      }
    }
    return Array.isArray(current) ? [...current] : [];
  }, [form]);

  const handleApprove = useCallback(() => {
    const metadataArray = parseMetadataArray();
    const filtered = metadataArray.filter((item) => item.key !== TEST_STATUS_KEY && item.key !== TEST_APPROVED_AT_KEY);
    filtered.push({ key: TEST_STATUS_KEY, value: TEST_STATUS_APPROVED });
    filtered.push({ key: TEST_APPROVED_AT_KEY, value: new Date().toISOString() });
    form.setValue('metadata', JSON.stringify(filtered, null, 2), { shouldDirty: true });
    form.handleSubmit(onSubmit)();
  }, [form, parseMetadataArray, onSubmit]);

  const handleUnapprove = useCallback(() => {
    const metadataArray = parseMetadataArray();
    const filtered = metadataArray.filter((item) => item.key !== TEST_STATUS_KEY && item.key !== TEST_APPROVED_AT_KEY);
    form.setValue('metadata', JSON.stringify(filtered, null, 2), { shouldDirty: true });
    form.handleSubmit(onSubmit)();
  }, [form, parseMetadataArray, onSubmit]);

  return !loaded || !resource ?
      <LoaderFullScreen />
    : <EditLayout
        headerInfo={
          !isNew && resource !== 'templates' ?
            <ul className="text-small flex gap-16">
              {defaultInformationFields.map((field, index) => (
                <li key={index + field}>
                  <strong>{capitalize(t(`common:${field}`))}: </strong>
                  {formdata?.[field]}
                </li>
              ))}
            </ul>
          : undefined
        }
        title={
          isNew ?
            capitalize(t('common:create_new', { resource: t(`${resource}:name`, { count: 1 }) }))
          : capitalize(t('common:edit', { resource: t(`${resource}:name_one`) }))
        }
        backLink={`/${resource}`}
      >
        <FormProvider {...form}>
          <form className="flex flex-row gap-32 justify-between grow flex-wrap" onSubmit={handleSubmit(onSubmit)}>
            <EditorToolbar
              resource={resource}
              id={id}
              isDirty={isDirty}
              isApproved={isApproved}
              onApprove={handleApprove}
              onUnapprove={handleUnapprove}
            />
            {isApproved && !isNew && (
              <div className="flex items-start gap-12 rounded-lg border-2 border-gronsta-500 bg-gronsta-50 dark:bg-gronsta-950 p-16 w-full">
                <Icon icon={<ShieldCheck />} className="shrink-0 mt-2 text-gronsta-500" />
                <div>
                  <span className="font-bold">Mallen är godkänd för produktion</span>
                  {approvedAt && (
                    <span className="text-small text-secondary ml-8">
                      (godkänd {new Date(approvedAt).toLocaleString('sv-SE')})
                    </span>
                  )}
                  <p className="text-small text-secondary mt-2">
                    Formuläret är låst. Lås upp mallen i verktygsfältet för att göra ändringar.
                  </p>
                </div>
              </div>
            )}
            <EditResourceTemplate isNew={isNew} isApproved={isApproved} />
          </form>
        </FormProvider>
      </EditLayout>;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'crud', 'layout', ...Object.keys(resources)])),
  },
});

export default EditTemplates;
