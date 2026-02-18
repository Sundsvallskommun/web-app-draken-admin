/* eslint-disable @typescript-eslint/no-explicit-any */
import { RJSFValidationError } from '@rjsf/utils';

// Swedish translations for common JSON Schema validation errors
const errorMessages: Record<string, string | ((params: Record<string, any>) => string)> = {
  required: 'Detta fält är obligatoriskt',
  enum: 'Välj ett giltigt alternativ',
  type: (params) => {
    const typeMap: Record<string, string> = {
      string: 'text',
      number: 'nummer',
      integer: 'heltal',
      boolean: 'ja/nej',
      array: 'lista',
      object: 'objekt',
    };
    const expected = typeMap[params.type] || params.type;
    return `Värdet måste vara av typen ${expected}`;
  },
  minLength: (params) => `Minst ${params.limit} tecken krävs`,
  maxLength: (params) => `Max ${params.limit} tecken tillåtet`,
  minimum: (params) => `Värdet måste vara minst ${params.limit}`,
  maximum: (params) => `Värdet får vara max ${params.limit}`,
  exclusiveMinimum: (params) => `Värdet måste vara större än ${params.limit}`,
  exclusiveMaximum: (params) => `Värdet måste vara mindre än ${params.limit}`,
  multipleOf: (params) => `Värdet måste vara en multipel av ${params.multipleOf}`,
  pattern: 'Värdet matchar inte det förväntade formatet',
  format: (params) => {
    const formatMap: Record<string, string> = {
      email: 'e-postadress',
      uri: 'URL',
      'date-time': 'datum och tid',
      date: 'datum',
      time: 'tid',
      hostname: 'värdnamn',
      ipv4: 'IPv4-adress',
      ipv6: 'IPv6-adress',
    };
    const expected = formatMap[params.format] || params.format;
    return `Värdet måste vara en giltig ${expected}`;
  },
  minItems: (params) => `Minst ${params.limit} objekt krävs`,
  maxItems: (params) => `Max ${params.limit} objekt tillåtet`,
  uniqueItems: 'Alla värden måste vara unika',
  const: 'Värdet matchar inte det förväntade värdet',
  additionalProperties: 'Ytterligare egenskaper är inte tillåtna',
  dependencies: 'Beroenden är inte uppfyllda',
  oneOf: 'Värdet måste matcha exakt ett av alternativen',
  anyOf: 'Värdet måste matcha minst ett av alternativen',
  not: 'Värdet får inte matcha det angivna schemat',
  if: 'Villkorlig validering misslyckades',
};

/**
 * Transforms RJSF validation errors to Swedish messages
 */
export function transformErrors(errors: RJSFValidationError[]): RJSFValidationError[] {
  return errors.map((error) => {
    const messageTemplate = errorMessages[error.name || ''];

    if (messageTemplate) {
      if (typeof messageTemplate === 'function') {
        error.message = messageTemplate(error.params || {});
      } else {
        error.message = messageTemplate;
      }
    }

    return error;
  });
}

export default transformErrors;
