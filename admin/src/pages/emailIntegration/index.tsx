import { EditResourceEmailIntegration } from '@components/edit-resource/edit-resource-email-integration.component';
import { EditorToolbar } from '@components/editor-toolbar/editor-toolbar';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import { Resource, ResourceResponse } from '@interfaces/resource';
import EditLayout from '@layouts/edit-layout/edit-layout.component';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { capitalize } from 'underscore.string';
import { FormControl, FormLabel, Select, Spinner } from '@sk-web-gui/react';

export const EmailIntegrationPage: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { namespace: urlNamespace } = router.query;

  const resource = 'emailIntegration' as ResourceName;

  const { municipalityId, selectedNamespace } = useLocalStorage();
  const activeNamespace = typeof urlNamespace === 'string' ? urlNamespace : selectedNamespace || undefined;

  const { getOne, update, defaultValues } = resources[resource];
  const { handleGetOne, handleUpdate } = useCrudHelper(resource);

  const apiServiceInstance = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

  type UpdateType = Parameters<NonNullable<Resource<FieldValues>['update']>>[2];

  const form = useForm<UpdateType>({
    defaultValues: defaultValues,
  });
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [namespacesLoaded, setNamespacesLoaded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    apiServiceInstance.namespaceControllerGetNamespaces(municipalityId).then((res) => {
      setNamespaces(res.data.data);
      setNamespacesLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityId]);

  useEffect(() => {
    if (activeNamespace && getOne) {
      setLoaded(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleGetOne<any>(() => getOne(municipalityId, activeNamespace)).then((res) => {
        if (res) {
          reset(res);
          setHasConfig(true);
        } else {
          reset(defaultValues);
          setHasConfig(false);
        }
        setLoaded(true);
      });
    } else {
      reset(defaultValues);
      setHasConfig(false);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNamespace, municipalityId]);

  const onNamespaceChange = (namespace: string) => {
    router.push({ pathname: router.pathname, query: { namespace } }, undefined, { shallow: true });
  };

  const onSubmit = (data: UpdateType) => {
    if (activeNamespace && update) {
      handleUpdate(() => update(municipalityId, activeNamespace, data) as ResourceResponse<Partial<FieldValues>>).then(
        (res) => {
          if (res) {
            reset(res);
            setHasConfig(true);
          }
        }
      );
    }
  };

  if (!namespacesLoaded) {
    return <LoaderFullScreen />;
  }

  return (
    <EditLayout
      title={capitalize(t(`${resource}:name_one`))}
      backLink={undefined}
    >
      <FormProvider {...form}>
        <form className="flex flex-col gap-24 grow" onSubmit={handleSubmit(onSubmit)}>
          {activeNamespace && <EditorToolbar resource={resource} isDirty={isDirty} id={activeNamespace} />}

          <FormControl required>
            <FormLabel>{capitalize(t('featureFlags:properties.namespace'))}</FormLabel>
            <Select
              className="w-[36rem]"
              value={activeNamespace || ''}
              onChange={(e) => onNamespaceChange(e.target.value)}
            >
              <Select.Option value="" disabled>
                {capitalize(t('common:select_namespace', { defaultValue: 'Välj namespace' }))}
              </Select.Option>
              {namespaces.map((ns, index) => (
                <Select.Option value={ns.namespace} key={index}>
                  {ns.displayName} ({ns.namespace})
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          {activeNamespace && !loaded && <Spinner />}
          {activeNamespace && loaded && <EditResourceEmailIntegration />}
        </form>
      </FormProvider>
    </EditLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'crud', 'layout', ...Object.keys(resources)])),
  },
});

export default EmailIntegrationPage;
