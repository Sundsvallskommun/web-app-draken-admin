import { EditResourceJsonSchema } from '@components/edit-resource/edit-resource-jsonschema.component';
import { EditorToolbar } from '@components/editor-toolbar/editor-toolbar';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import resources from '@config/resources';
import { Resource, ResourceResponse } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import EditLayout from '@layouts/edit-layout/edit-layout.component';
import { useRouteGuard } from '@utils/routeguard.hook';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { capitalize } from 'underscore.string';

export const EditJsonSchema: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { municipalityId } = useLocalStorage();

  const { id: _id } = useParams();
  const resource = 'jsonSchemas';

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
    formState: { isDirty },
  } = form;

  const id = _id === 'new' ? undefined : _id;

  const [loaded, setLoaded] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(!id);

  useRouteGuard(isDirty);

  useEffect(() => {
    if (id) {
      setIsNew(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && getOne) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleGetOne<any>(() => getOne(municipalityId, id as any)).then(res => {
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

  const onSubmit = async (data: DataType) => {
    if (isNew) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await handleCreate(() => create?.(municipalityId, data as any) as ResourceResponse<any>);
      if (result) {
        // Navigate to the created schema
        router.push(`/${resource}/${result.id}`);
        refresh();
      }
    } else if (id && update) {
      // Update creates a new version of the schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await handleUpdate(() => update(municipalityId, id as any, data) as ResourceResponse<any>);
      if (result?.data) {
        // Navigate to the new version
        router.push(`/${resource}/${result.data.id}`);
        refresh();
      }
    }
  };

  return !loaded || !resource ? (
    <LoaderFullScreen />
  ) : (
    <EditLayout
      title={
        isNew
          ? capitalize(t('common:create_new', { resource: t(`${resource}:name`, { count: 1 }) }))
          : capitalize(t('common:edit', { resource: t(`${resource}:name_one`) }))
      }
      backLink={`/${resource}`}
    >
      <FormProvider {...form}>
        <form className="flex flex-row gap-32 justify-between grow flex-wrap" onSubmit={handleSubmit(onSubmit)}>
          <EditorToolbar resource={resource} isDirty={isDirty} id={id} />
          <EditResourceJsonSchema isNew={isNew} schemaId={id as string} />
        </form>
      </FormProvider>
    </EditLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'crud', 'layout', 'jsonSchemas', ...Object.keys(resources)])),
  },
});

export default EditJsonSchema;
