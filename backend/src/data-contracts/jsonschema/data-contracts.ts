/* eslint-disable */
/* tslint:disable */

/** JSON Schema entity */
export interface JsonSchemaEntity {
  /** Schema ID composed by municipalityId, schema name and version */
  id: string;
  /** Schema name */
  name: string;
  /** Schema version on the format [major version].[minor version] */
  version: string;
  /** The JSON schema object */
  value: Record<string, unknown>;
  /** Description of the schema purpose */
  description?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
  /** Number of times this schema has been used to validate a JSON instance */
  validationUsageCount?: number;
  /**
   * Timestamp when this schema was last used to validate a JSON instance
   * @format date-time
   */
  lastUsedForValidation?: string;
}

/** JSON Schema create request */
export interface JsonSchemaCreateRequest {
  /** Schema name */
  name: string;
  /** Schema version on the format [major version].[minor version] */
  version: string;
  /** The JSON schema object */
  value: Record<string, unknown>;
  /** Description of the schema purpose */
  description?: string;
}

/** UI Schema entity */
export interface UiSchemaEntity {
  /** UI Schema ID */
  id: string;
  /** The UI schema object */
  value: Record<string, unknown>;
  /** Description of the UI schema purpose */
  description?: string;
  /**
   * Created timestamp
   * @format date-time
   */
  created?: string;
}

/** UI Schema request */
export interface UiSchemaRequest {
  /** The UI schema object */
  value: Record<string, unknown>;
  /** Description of the UI schema purpose */
  description?: string;
}

/** Paginated JSON Schema response */
export interface PageJsonSchema {
  /** Total number of elements */
  totalElements: number;
  /** Total number of pages */
  totalPages: number;
  /** Page size */
  size: number;
  /** Page content */
  content: JsonSchemaEntity[];
  /** Current page number */
  number: number;
  /** Whether this is the first page */
  first: boolean;
  /** Whether this is the last page */
  last: boolean;
  /** Number of elements in this page */
  numberOfElements: number;
  /** Whether the page is empty */
  empty: boolean;
}

export interface Problem {
  /** @format uri */
  instance?: string;
  /** @format uri */
  type?: string;
  parameters?: Record<string, unknown>;
  status?: StatusType;
  title?: string;
  detail?: string;
}

export interface StatusType {
  /** @format int32 */
  statusCode?: number;
  reasonPhrase?: string;
}
