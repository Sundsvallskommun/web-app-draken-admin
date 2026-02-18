'use client';
/* eslint-disable react-refresh/only-export-components */

import { TemplatesType } from '@rjsf/utils';
import { FieldTemplate } from './field-template';
import { ObjectFieldTemplate } from './object-field-template';
import { BaseInputTemplate } from './base-input-template';
import { ErrorListTemplate } from './error-list-template';

export const skWebGuiTemplates: Partial<TemplatesType> = {
  FieldTemplate: FieldTemplate,
  ObjectFieldTemplate: ObjectFieldTemplate,
  BaseInputTemplate: BaseInputTemplate,
  ErrorListTemplate: ErrorListTemplate,
};

export { FieldTemplate, ObjectFieldTemplate, BaseInputTemplate, ErrorListTemplate };
