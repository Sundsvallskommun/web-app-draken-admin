import * as React from 'react';
import { useForm } from 'react-hook-form';
import { type FieldErrorMap, fieldErrorsResolver } from './namespace-wizard-validation';
import type { FormValues } from './namespace-wizard-types';

/**
 * A react-hook-form form that writes every change back to the wizard draft, so going back
 * never loses input, and validates with the same rules the stepper and review use.
 */
export function useDraftSyncedForm({
  defaultValues,
  validate,
  onValuesChange,
}: {
  defaultValues: FormValues;
  validate: (values: FormValues) => FieldErrorMap;
  onValuesChange: (values: FormValues) => void;
}) {
  // Refs keep the resolver and watcher current without recreating the form.
  const validateRef = React.useRef(validate);
  validateRef.current = validate;
  const onValuesChangeRef = React.useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  const form = useForm<FormValues>({
    defaultValues,
    resolver: fieldErrorsResolver((values) => validateRef.current(values)),
  });

  React.useEffect(() => {
    const subscription = form.watch((values) => onValuesChangeRef.current({ ...values }));
    return () => subscription.unsubscribe();
  }, [form]);

  return form;
}
