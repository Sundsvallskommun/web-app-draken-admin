import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { Button, FormControl, FormLabel, Input, Select, Spinner } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

interface EditResourceCategoryProps {
  isNew?: boolean;
}

// Requires a value of the form local@domain.tld, i.e. the domain must contain a dot.
// Matches the backend's class-validator @IsEmail() check so the form fails fast instead of a 400.
const EMAIL_WITH_TLD_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EditResourceCategory: React.FC<EditResourceCategoryProps> = ({ isNew = true }) => {
  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
  const { t } = useTranslation();
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const namespace = watch('namespace');

  const { municipalityId } = useLocalStorage();

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const { fields, append, remove } = useFieldArray({ control, name: 'types' });

  useEffect(() => {
    apiService.namespaceControllerGetNamespaces(municipalityId).then((res) => {
      setNamespaces(res.data.data);
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoaded) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-12 grow">
      <FormControl required>
        <FormLabel>{capitalize(t('categories:properties.name'))}</FormLabel>
        <Input {...register('name')} className="w-[36rem]" disabled={!isNew} />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t('categories:properties.displayName'))}</FormLabel>
        <Input {...register('displayName')} className="w-[36rem]" />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t('categories:properties.sortOrder'))}</FormLabel>
        <Input type="number" {...register('sortOrder', { valueAsNumber: true })} className="w-[36rem]" />
      </FormControl>
      <FormControl required>
        <FormLabel>{capitalize(t('featureFlags:properties.namespace'))}</FormLabel>
        <Select {...register('namespace')} className="w-[36rem]" invalid={!namespace} disabled={!isNew}>
          {namespaces.map((namespace, index) => (
            <Select.Option value={namespace.namespace} key={index}>
              {namespace.displayName} ({namespace.namespace})
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      <div className="flex flex-col gap-16 mt-16">
        <header className="flex gap-24 items-center">
          <h3 className="font-header text-h4-md">{capitalize(t('categories:properties.types'))}</h3>
          <Button
            size="sm"
            color="success"
            leftIcon={<Plus />}
            onClick={() => append({ name: '', displayName: '', escalationEmail: '' })}
          >
            {capitalize(t('common:add'))} {t('categories:properties.type')}
          </Button>
        </header>

        {fields.map((field, index) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const emailError = (errors as any)?.types?.[index]?.escalationEmail;
          return (
          <div key={field.id} className="flex gap-12 items-end w-full">
            <FormControl required className="grow">
              <FormLabel>{capitalize(t('categories:properties.name'))}</FormLabel>
              <Input {...register(`types.${index}.name`)} className="w-full" />
            </FormControl>
            <FormControl className="grow">
              <FormLabel>{capitalize(t('categories:properties.displayName'))}</FormLabel>
              <Input {...register(`types.${index}.displayName`)} className="w-full" />
            </FormControl>
            <FormControl className="grow" invalid={!!emailError}>
              <FormLabel>{capitalize(t('categories:properties.escalationEmail'))}</FormLabel>
              <Input
                type="email"
                {...register(`types.${index}.escalationEmail`, {
                  validate: (value) =>
                    !value || EMAIL_WITH_TLD_REGEX.test(value) || (t('categories:invalidEmail') as string),
                })}
                className="w-full"
              />
            </FormControl>
            <Button
              size="sm"
              rounded
              color="error"
              iconButton
              aria-label={capitalize(t('common:remove'))}
              onClick={() => remove(index)}
            >
              <Minus />
            </Button>
          </div>
          );
        })}
      </div>
    </div>
  );
};
