import { Api } from '@data-contracts/backend/Api';
import {
  FeatureFlag,
  FeatureFlagRequestDto,
  Namespace,
  NamespaceRequestDto,
  Role,
  RoleRequestDto,
  Status,
  StatusRequestDto,
  UpdateFeatureFlagDto,
} from '@data-contracts/backend/data-contracts';
import { Resource } from '@interfaces/resource';
import { ID } from '@interfaces/resource-services';
import { ServiceResponse } from '@interfaces/services';
import { JsonSchema, JsonSchemaCreateRequest } from '@interfaces/jsonschema';
import { Template } from '@services/templating/templating-service';
import { HttpClient } from './http-client';

const httpClient = new HttpClient({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });
const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

const featureFlags: Resource<FeatureFlag, FeatureFlagRequestDto, UpdateFeatureFlagDto> = {
  name: 'featureFlags',
  getOne: apiService.featureFlagControllerGetFeatureFlag,
  getMany: apiService.featureFlagControllerGetFeatureFlags,
  create: apiService.featureFlagControllerCreateFeatureFlag,
  update: apiService.featureFlagControllerUpdateFeatureFlag,
  remove: apiService.featureFlagControllerDeleteFeatureFlag,

  defaultValues: {
    name: '',
    enabled: false,
    application: '',
    namespace: '',
  },
  requiredFields: ['name', 'enabled', 'application', 'namespace'],
};

const namespaces: Resource<Namespace, NamespaceRequestDto, NamespaceRequestDto> = {
  name: 'namespaces',
  getOne: apiService.namespaceControllerGetNamespace,
  getMany: apiService.namespaceControllerGetSupportManagementNamespaces,
  create: apiService.namespaceControllerCreateNamespace,
  update: apiService.namespaceControllerUpdateNamespace,

  defaultValues: {
    namespace: '',
    displayName: '',
    shortCode: '',
    notificationTTLInDays: 40,
    accessControl: false,
    notifyReporter: false,
  },
  requiredFields: ['namespace', 'displayName', 'shortCode', 'notificationTTLInDays'],
};

const roles: Resource<Role, RoleRequestDto> = {
  name: 'roles',
  getMany: apiService.rolesControllerGetRoles,
  create: apiService.rolesControllerCreateRole,
  remove: apiService.rolesControllerDeleteRole,

  defaultValues: {
    name: '',
    displayName: '',
    namespace: '',
  },
  requiredFields: ['name', 'displayName', 'namespace'],
};

const statuses: Resource<Status, StatusRequestDto> = {
  name: 'statuses',
  getMany: apiService.statusesControllerGetStatuses,
  create: apiService.statusesControllerCreateStatus,
  remove: apiService.statusesControllerDeleteStatus,

  defaultValues: {
    name: '',
    namespace: '',
  },
  requiredFields: ['name', 'namespace'],
};

// TODO: Refactor templates to use apiService?
const templates: Resource<Template> = {
  name: 'templates',

  getMany: async (
    municipalityId: number,
    query?: {
      namespace?: string;
    }
  ) => {
    return httpClient.request<ServiceResponse<Template[]>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates/${municipalityId}?namespace=${query?.namespace}`,
      method: 'GET',
    });
  },

  getOne: async (municipalityId: number, identifier: ID) => {
    const res = await httpClient.request<ServiceResponse<Template>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates/${municipalityId}/${identifier}`,
      method: 'GET',
    });
    return res;
  },

  update: async (municipalityId: number, identifier: ID, data: Partial<Template>) => {
    const response = await httpClient.request<Template, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates/${municipalityId}`,
      method: 'POST',
      body: data,
    });

    return {
      ...response,
      data: { data: response.data },
    };
  },

  create: async (municipalityId: number, data: Partial<Template>) => {
    const response = await httpClient.request<Template, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates/${municipalityId}`,
      method: 'POST',
      body: data,
    });

    return {
      ...response,
      data: { data: response.data },
    };
  },

  defaultValues: {
    identifier: '',
    name: '',
    description: '',
    metadata: '[]',
    defaultValues: '[]',
    content: '',
    versionIncrement: 'MINOR',
    changeLog: '',
    id: undefined,
  },
  requiredFields: ['identifier'],
};

// Helper to calculate next version
const getNextSchemaVersion = (currentVersion: string, increment: 'MINOR' | 'MAJOR'): string => {
  const [major, minor] = currentVersion.split('.').map(Number);
  if (increment === 'MAJOR') {
    return `${major + 1}.0`;
  }
  return `${major}.${minor + 1}`;
};

const jsonSchemas: Resource<JsonSchema, Partial<JsonSchemaCreateRequest>, Partial<JsonSchemaCreateRequest>> = {
  name: 'jsonSchemas',

  getMany: async (municipalityId: number) => {
    return httpClient.request<ServiceResponse<JsonSchema[]>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}`,
      method: 'GET',
    });
  },

  getOne: async (municipalityId: number, id: ID) => {
    return httpClient.request<ServiceResponse<JsonSchema>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${id}`,
      method: 'GET',
    });
  },

  create: async (municipalityId: number, data: Partial<JsonSchema>) => {
    const response = await httpClient.request<ServiceResponse<JsonSchema>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}`,
      method: 'POST',
      body: data,
    });
    return response;
  },

  // Update creates a new version of the schema (API doesn't support PUT)
  update: async (municipalityId: number, _id: ID, data: Partial<JsonSchema> & { versionIncrement?: 'MINOR' | 'MAJOR' }) => {
    const versionIncrement = data.versionIncrement || 'MINOR';
    const currentVersion = data.version || '1.0';
    const newVersion = getNextSchemaVersion(currentVersion, versionIncrement);

    // Create new schema with incremented version
    const createData = {
      name: data.name,
      version: newVersion,
      value: data.value,
      description: data.description,
    };

    const response = await httpClient.request<ServiceResponse<JsonSchema>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}`,
      method: 'POST',
      body: createData,
    });

    return {
      ...response,
      data: { data: response.data?.data },
    };
  },

  remove: async (municipalityId: number, _filter: unknown, id: ID) => {
    return httpClient.request<ServiceResponse<boolean>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/jsonschemas/${municipalityId}/${id}`,
      method: 'DELETE',
    });
  },

  defaultValues: {
    name: '',
    version: '1.0',
    value: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {},
    },
    description: '',
  },
  requiredFields: ['name', 'version', 'value'],
};

const resources = { featureFlags, templates, jsonSchemas, roles, statuses, namespaces };
export default resources;
