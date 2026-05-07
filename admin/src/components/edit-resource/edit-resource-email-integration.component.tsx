import { Checkbox, FormControl, FormLabel, Input, Textarea } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

export const EditResourceEmailIntegration: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, setValue } = useFormContext();

  const enabled = watch('enabled');
  const addSenderAsStakeholder = watch('addSenderAsStakeholder');
  const ignoreAutoReply = watch('ignoreAutoReply');
  const ignoreNoReply = watch('ignoreNoReply');

  return (
    <div className="flex flex-col gap-24 max-w-[72rem]">
      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.general')}</legend>
        <FormControl>
          <Checkbox
            checked={enabled}
            onChange={(e) => setValue('enabled', e.target.checked, { shouldDirty: true })}
          >
            {capitalize(t('emailIntegration:properties.enabled'))}
          </Checkbox>
        </FormControl>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.errandChannel'))}</FormLabel>
          <Input {...register('errandChannel')} className="w-[36rem]" />
        </FormControl>
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.newErrand')}</legend>
        <FormControl required>
          <FormLabel>{capitalize(t('emailIntegration:properties.statusForNew'))}</FormLabel>
          <Input {...register('statusForNew')} className="w-[36rem]" />
        </FormControl>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.errandNewEmailSender'))}</FormLabel>
          <Input {...register('errandNewEmailSender')} className="w-[36rem]" />
        </FormControl>
        <FormControl className='w-full'>
          <FormLabel>{capitalize(t('emailIntegration:properties.errandNewEmailTemplate'))}</FormLabel>
          <Textarea {...register('errandNewEmailTemplate')} className="w-full" rows={10} />
        </FormControl>
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.closedErrand')}</legend>
        <FormControl className='w-full'>
          <FormLabel>{capitalize(t('emailIntegration:properties.errandClosedEmailSender'))}</FormLabel>
          <Input {...register('errandClosedEmailSender')} className="w-[36rem]" />
        </FormControl>
        <FormControl className='w-full'>
          <FormLabel>{capitalize(t('emailIntegration:properties.errandClosedEmailTemplate'))}</FormLabel>
          <Textarea  {...register('errandClosedEmailTemplate')} className="w-full" rows={10} />
        </FormControl>
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.statusTransitions')}</legend>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.triggerStatusChangeOn'))}</FormLabel>
          <Input {...register('triggerStatusChangeOn')} className="w-[36rem]" />
        </FormControl>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.statusChangeTo'))}</FormLabel>
          <Input {...register('statusChangeTo')} className="w-[36rem]" />
        </FormControl>
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.inactivity')}</legend>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.daysOfInactivityBeforeReject'))}</FormLabel>
          <Input
            type="number"
            {...register('daysOfInactivityBeforeReject', { valueAsNumber: true })}
            className="w-[36rem]"
          />
        </FormControl>
        <FormControl>
          <FormLabel>{capitalize(t('emailIntegration:properties.inactiveStatus'))}</FormLabel>
          <Input {...register('inactiveStatus')} className="w-[36rem]" />
        </FormControl>
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.stakeholder')}</legend>
        <FormControl>
          <Checkbox
            checked={addSenderAsStakeholder}
            onChange={(e) => setValue('addSenderAsStakeholder', e.target.checked, { shouldDirty: true })}
          >
            {capitalize(t('emailIntegration:properties.addSenderAsStakeholder'))}
          </Checkbox>
        </FormControl>
        {addSenderAsStakeholder && (
          <FormControl>
            <FormLabel>{capitalize(t('emailIntegration:properties.stakeholderRole'))}</FormLabel>
            <Input {...register('stakeholderRole')} className="w-[36rem]" />
          </FormControl>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-12 border border-divider rounded-groups p-16">
        <legend className="font-bold px-8">{t('emailIntegration:sections.filtering')}</legend>
        <FormControl>
          <Checkbox
            checked={ignoreAutoReply}
            onChange={(e) => setValue('ignoreAutoReply', e.target.checked, { shouldDirty: true })}
          >
            {capitalize(t('emailIntegration:properties.ignoreAutoReply'))}
          </Checkbox>
        </FormControl>
        <FormControl>
          <Checkbox
            checked={ignoreNoReply}
            onChange={(e) => setValue('ignoreNoReply', e.target.checked, { shouldDirty: true })}
          >
            {capitalize(t('emailIntegration:properties.ignoreNoReply'))}
          </Checkbox>
        </FormControl>
      </fieldset>
    </div>
  );
};
