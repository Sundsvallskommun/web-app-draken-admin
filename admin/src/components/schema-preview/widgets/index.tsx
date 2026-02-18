'use client';
/* eslint-disable react-refresh/only-export-components */

import { RegistryWidgetsType } from '@rjsf/utils';
import { SelectWidget } from './select-widget';
import { ComboboxWidget } from './combobox-widget';
import { RadiobuttonWidget } from './radiobutton-widget';
import { DateWidget } from './date-widget';
import { TexteditorWidget } from './texteditor-widget';
import { TextWidget } from './text-widget';
import { CheckboxWidget } from './checkbox-widget';
import { TextareaWidget } from './textarea-widget';

// Custom widgets mapped to sk-web-gui components
// Include multiple case variations to ensure matching
export const skWebGuiWidgets: RegistryWidgetsType = {
  // Standard RJSF widget overrides
  TextWidget: TextWidget,
  text: TextWidget,

  TextareaWidget: TextareaWidget,
  textarea: TextareaWidget,

  SelectWidget: SelectWidget,
  select: SelectWidget,

  CheckboxWidget: CheckboxWidget,
  checkbox: CheckboxWidget,

  // Date widgets - multiple variations
  DateWidget: DateWidget,
  date: DateWidget,
  datewidget: DateWidget,
  'date-widget': DateWidget,

  // Custom Combobox widget - multiple variations
  ComboboxWidget: ComboboxWidget,
  comboboxWidget: ComboboxWidget,
  comboboxwidget: ComboboxWidget,
  combobox: ComboboxWidget,
  Combobox: ComboboxWidget,

  // Custom Radiobutton widget - multiple variations
  RadiobuttonWidget: RadiobuttonWidget,
  radiobuttonWidget: RadiobuttonWidget,
  radiobuttonwidget: RadiobuttonWidget,
  radiobutton: RadiobuttonWidget,
  Radiobutton: RadiobuttonWidget,
  RadioButtonWidget: RadiobuttonWidget,
  radio: RadiobuttonWidget,

  // Custom Texteditor widget - multiple variations
  TexteditorWidget: TexteditorWidget,
  texteditorWidget: TexteditorWidget,
  texteditorwidget: TexteditorWidget,
  texteditor: TexteditorWidget,
  Texteditor: TexteditorWidget,
  TextEditor: TexteditorWidget,
  textEditor: TexteditorWidget,
  'text-editor': TexteditorWidget,
  richtext: TexteditorWidget,
  RichText: TexteditorWidget,
};

export {
  SelectWidget,
  ComboboxWidget,
  RadiobuttonWidget,
  DateWidget,
  TexteditorWidget,
  TextWidget,
  CheckboxWidget,
  TextareaWidget,
};
