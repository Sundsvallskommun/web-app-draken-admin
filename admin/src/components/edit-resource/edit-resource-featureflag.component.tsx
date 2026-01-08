import { Api } from '@data-contracts/backend/Api';
import { Namespace } from '@data-contracts/backend/data-contracts';
import { FormControl, FormLabel, Input, Select, Spinner, Switch } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

interface EditResourceProps {
  isNew?: boolean;
}

export const EditResourceFeatureFlag: React.FC<EditResourceProps> = ({ isNew }) => {
  const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
  const { t } = useTranslation();
  const { setValue, register, watch } = useFormContext();

  const namespace = watch('namespace');

  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    apiService.namespaceControllerGetNamespaces().then((res) => {
      setNamespaces(res.data.data);
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    switch (namespace) {
      case 'CONTACTCENTER':
      case 'CONTACTSUNDSVALL':
        setValue('application', 'KC');
        break;
      case 'SALARYANDPENSION':
        setValue('application', 'LOP');
        break;
      case 'INTERNALSERVICE':
        setValue('application', 'IK');
        break;
      case 'MSVA':
        setValue('application', 'MSVA');
        break;
      case 'ROB':
        setValue('application', 'ROB');
        break;
      case 'HEALTHCAREDEVIATIONVOF':
        setValue('application', 'VOF');
        break;
      case 'HEALTHCAREDEVIATIONIAF':
        setValue('application', 'IAF');
        break;
      case 'SERVICECENTERFINANCE':
        setValue('application', 'SE');
        break;
      case 'SBK_MEX':
        setValue('application', 'MEX');
        break;
      case 'SBK_PARKING_PERMIT':
        setValue('application', 'PT');
        break;
      default:
        setValue('application', '');
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  if (!isLoaded) {
    return <Spinner />;
  }

  return (
    <>
      <div className="flex flex-col gap-12">
        <div className="flex flex-row gap-24">
          <FormControl required readOnly={!isNew}>
            <FormLabel>{capitalize(t(`featureFlags:properties.name`))}</FormLabel>
            <Input {...register('name')} className="w-[36rem]" />
          </FormControl>
          <FormControl required>
            <FormLabel>{capitalize(t(`featureFlags:properties.enabled`))}</FormLabel>
            <Switch {...register('enabled')} />
          </FormControl>
        </div>
        <FormControl required readOnly={!isNew}>
          <FormLabel>{capitalize(t(`featureFlags:properties.application`))}</FormLabel>
          <Input {...register('application')} className="w-[36rem]" />
        </FormControl>
        <FormControl required>
          <FormLabel>{capitalize(t(`featureFlags:properties.namespace`))}</FormLabel>
          <Select {...register('namespace')} className="w-[36rem]" readOnly={!isNew}>
            {namespaces.map((namespace, index) => {
              return (
                <Select.Option value={namespace.namespace} key={index}>
                  {namespace.displayName} ({namespace.namespace})
                </Select.Option>
              );
            })}
          </Select>
        </FormControl>
      </div>
    </>
  );
};
