import { EditResourceRole } from '@components/edit-resource/edit-resource-role.component';
import { EditorToolbar } from '@components/editor-toolbar/editor-toolbar';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import resources from '@config/resources';
import { Resource } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import EditLayout from '@layouts/edit-layout/edit-layout.component';
import { useCrudHelper } from '@utils/use-crud-helpers';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { capitalize } from 'underscore.string';

export const EditRole: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const resource = 'roles';

  const { municipalityId } = useLocalStorage();

  const { create, defaultValues } = resources[resource as ResourceName];
  const { handleCreate } = useCrudHelper(resource as ResourceName);

  type CreateType = Parameters<NonNullable<Resource<FieldValues>['create']>>[1];
  type DataType = CreateType;

  const form = useForm<DataType>({
    defaultValues: defaultValues,
  });
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form;

  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    reset(defaultValues);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const onSubmit = (data: DataType) => {
    const createFunc: (
      municipalityId: number,
      data: DataType
    ) => ReturnType<NonNullable<Resource<FieldValues>['create']>> = create as NonNullable<
      Resource<FieldValues>['create']
    >;

    handleCreate(() => createFunc(municipalityId, data as CreateType)).then((res) => {
      if (res) {
        router.push(`/${resource}`);
      }
    });
  };

  return !loaded || !resource ?
      <LoaderFullScreen />
    : <EditLayout
        title={capitalize(t('common:create_new', { resource: t(`${resource}:name`, { count: 1 }) }))}
        backLink={`/${resource}`}
      >
        <FormProvider {...form}>
          <form className="flex flex-row gap-32 justify-between grow flex-wrap" onSubmit={handleSubmit(onSubmit)}>
            <EditorToolbar resource={resource} isDirty={isDirty} />
            <EditResourceRole />
          </form>
        </FormProvider>
      </EditLayout>;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'crud', 'layout', ...Object.keys(resources)])),
  },
});

export default EditRole;
