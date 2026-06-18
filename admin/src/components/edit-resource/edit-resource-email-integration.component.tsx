import { Checkbox, FormControl, FormLabel, Input } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { capitalize } from 'underscore.string';

const TextEditor = dynamic(() => import('@sk-web-gui/text-editor'), { ssr: false });

export const EditResourceEmailIntegration: React.FC = () => {
  const { t } = useTranslation();
  const { register, watch, setValue } = useFormContext();

  const enabled = watch('enabled');
  const addSenderAsStakeholder = watch('addSenderAsStakeholder');
  const ignoreAutoReply = watch('ignoreAutoReply');
  const ignoreNoReply = watch('ignoreNoReply');
  const errandNewEmailTemplate = watch('errandNewEmailTemplate');
  const errandNewEmailHTMLTemplate = watch('errandNewEmailHTMLTemplate');
  const errandClosedEmailTemplate = watch('errandClosedEmailTemplate');
  const errandClosedEmailHTMLTemplate = watch('errandClosedEmailHTMLTemplate');

  // The editor exposes both the HTML markup and a plain-text rendering, so a single
  // editor feeds both contract fields. It fires onChange once on mount while ingesting
  // the initial value; guard against that so loading a config doesn't mark it dirty.
  // Seed the editor from the legacy plain-text template when no HTML exists yet, so
  // pre-existing configs don't appear empty.
  const newEmailInitialized = useRef(false);
  const closedEmailInitialized = useRef(false);

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
          <TextEditor
            className="w-full min-h-[24rem] mb-[5rem]"
            value={{ markup: errandNewEmailHTMLTemplate || errandNewEmailTemplate || '' }}
            onChange={(e) => {
              setValue('errandNewEmailHTMLTemplate', e.target.value.markup ?? '', {
                shouldDirty: newEmailInitialized.current,
              });
              setValue('errandNewEmailTemplate', e.target.value.plainText ?? '', {
                shouldDirty: newEmailInitialized.current,
              });
              newEmailInitialized.current = true;
            }}
          />
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
          <TextEditor
            className="w-full min-h-[24rem] mb-[5rem]"
            value={{ markup: errandClosedEmailHTMLTemplate || errandClosedEmailTemplate || '' }}
            onChange={(e) => {
              setValue('errandClosedEmailHTMLTemplate', e.target.value.markup ?? '', {
                shouldDirty: closedEmailInitialized.current,
              });
              setValue('errandClosedEmailTemplate', e.target.value.plainText ?? '', {
                shouldDirty: closedEmailInitialized.current,
              });
              closedEmailInitialized.current = true;
            }}
          />
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
