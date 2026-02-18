export interface JsonSchema {
  id: string;
  name: string;
  version: string;
  value: Record<string, unknown>;
  description?: string;
  created?: string;
  validationUsageCount?: number;
  lastUsedForValidation?: string;
  numericId?: number;
}

export interface JsonSchemaCreateRequest {
  name: string;
  version: string;
  value: Record<string, unknown>;
  description?: string;
}

export interface UiSchema {
  id: string;
  value: Record<string, unknown>;
  description?: string;
  created?: string;
}

export interface UiSchemaRequest {
  value: Record<string, unknown>;
  description?: string;
}
