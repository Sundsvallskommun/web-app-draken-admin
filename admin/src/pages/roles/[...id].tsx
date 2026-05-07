import { EditResourceRole } from '@components/edit-resource/edit-resource-role.component';
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
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { capitalize } from 'underscore.string';

export const EditRole: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: routeId } = router.query;

  const resource = 'roles';

  const { municipalityId } = useLocalStorage();

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

  // routeId is the [...id] catch-all or single segment like "NAMESPACE/roleName"
  // Next.js will have the path segments as the id param
  const compositeId = Array.isArray(routeId) ? routeId.join('/') : routeId;
  const isNewRoute = compositeId === 'new';
  const id = isNewRoute ? undefined : compositeId;

  const [loaded, setLoaded] = useState<boolean>(false);
  const [isNew, setIsNew] = useState<boolean>(!id);

  const formdata = getFormattedFields(watch());

  useRouteGuard(isDirty);

  useEffect(() => {
    if (id && getOne) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleGetOne<any>(() => getOne(municipalityId, id)).then((res) => {
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

  const onSubmit = (data: DataType) => {
    if (isNew) {
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
    } else if (id) {
      handleUpdate(() => update?.(municipalityId, id, data) as ResourceResponse<Partial<FieldValues>>).then(
        (res) => {
          if (res) {
            reset(res);
            refresh();
          }
        }
      );
    }
  };

  return !loaded || !resource ?
      <LoaderFullScreen />
    : <EditLayout
        headerInfo={
          !isNew ?
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
            <EditorToolbar resource={resource} isDirty={isDirty} id={id} />
            <EditResourceRole isNew={isNew} />
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
