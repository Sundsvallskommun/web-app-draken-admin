import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { FormControl, FormLabel, Input, Select, Spinner } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

interface EditResourceContactReasonProps {
  isNew?: boolean;
}

export const EditResourceContactReason: React.FC<EditResourceContactReasonProps> = ({ isNew = true }) => {
  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
  const { t } = useTranslation();
  const { register, watch } = useFormContext();

  const namespace = watch('namespace');

  const { municipalityId } = useLocalStorage();

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

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
    <div className="flex flex-col gap-12">
      <FormControl required>
        <FormLabel>{capitalize(t('contactReasons:properties.reason'))}</FormLabel>
        <Input {...register('reason')} className="w-[36rem]" disabled={!isNew} />
      </FormControl>
      <FormControl>
        <FormLabel>{capitalize(t('contactReasons:properties.displayName'))}</FormLabel>
        <Input {...register('displayName')} className="w-[36rem]" />
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
    </div>
  );
};
