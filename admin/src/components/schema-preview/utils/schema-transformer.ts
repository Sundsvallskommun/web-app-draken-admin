/* eslint-disable @typescript-eslint/no-explicit-any */
import { RJSFSchema } from '@rjsf/utils';

/**
 * Transforms a schema for RJSF preview to handle conditional field visibility.
 *
 * The existing schema format uses allOf/if/then with just "required" to make fields
 * conditionally required, but the field definition stays in root properties.
 * RJSF doesn't hide fields in this format.
 *
 * This transformer moves field definitions from root properties to allOf[].then.properties
 * so that RJSF will properly hide/show fields based on conditions.
 *
 * This is only used for preview - it doesn't modify the actual saved schema.
 */
export function transformSchemaForPreview(schema: RJSFSchema): RJSFSchema {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const allOf = schema.allOf as any[] | undefined;
  if (!allOf || !Array.isArray(allOf) || allOf.length === 0) {
    return schema;
  }

  // Find all fields that have conditions (in allOf[].then.required)
  // and move their definitions from root properties to then.properties
  const fieldsToMove = new Set<string>();
  const conditionMap = new Map<string, any>(); // fieldName -> condition object

  for (const condition of allOf) {
    if (!condition.if?.properties || !condition.then) {
      continue;
    }

    const thenRequired = condition.then.required as string[] | undefined;
    const thenProperties = condition.then.properties as Record<string, any> | undefined;

    // If there's already properties in then, this condition is already in the correct format
    if (thenProperties && Object.keys(thenProperties).length > 0) {
      continue;
    }

    // Find fields that are only in required (not in properties)
    if (thenRequired && thenRequired.length > 0) {
      for (const fieldName of thenRequired) {
        // Only process if the field is in root properties
        if (schema.properties?.[fieldName]) {
          fieldsToMove.add(fieldName);
          conditionMap.set(fieldName, condition);
        }
      }
    }
  }

  // If no fields need to be moved, return original schema
  if (fieldsToMove.size === 0) {
    return schema;
  }

  // Create new properties without the fields to move
  const newProperties: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema.properties || {})) {
    if (!fieldsToMove.has(key)) {
      newProperties[key] = value;
    }
  }

  // Create new allOf with field definitions moved to then.properties
  const newAllOf = allOf.map((condition) => {
    if (!condition.if?.properties || !condition.then) {
      return condition;
    }

    const thenRequired = condition.then.required as string[] | undefined;
    const thenProperties = condition.then.properties as Record<string, any> | undefined;

    // If already has properties, keep as is
    if (thenProperties && Object.keys(thenProperties).length > 0) {
      return condition;
    }

    // Find fields from thenRequired that we need to move
    const fieldsForThisCondition: Record<string, any> = {};
    if (thenRequired) {
      for (const fieldName of thenRequired) {
        if (fieldsToMove.has(fieldName) && schema.properties?.[fieldName]) {
          fieldsForThisCondition[fieldName] = schema.properties[fieldName];
        }
      }
    }

    // If we found fields to move, create new condition with properties
    if (Object.keys(fieldsForThisCondition).length > 0) {
      return {
        ...condition,
        then: {
          ...condition.then,
          properties: fieldsForThisCondition,
        },
      };
    }

    return condition;
  });

  // Remove moved fields from root required array too
  const rootRequired = schema.required as string[] | undefined;
  const newRequired = rootRequired?.filter((r) => !fieldsToMove.has(r));

  return {
    ...schema,
    properties: newProperties,
    required: newRequired && newRequired.length > 0 ? newRequired : undefined,
    allOf: newAllOf,
  };
}

export default transformSchemaForPreview;
