import { Api } from '@data-contracts/backend/Api';
import { FeatureFlag, FeatureFlagRequestDto, UpdateFeatureFlagDto } from '@data-contracts/backend/data-contracts';
import { Resource } from '@interfaces/resource';
import { ID } from '@interfaces/resource-services';
import { ServiceResponse } from '@interfaces/services';
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
  requiredFields: ['name', 'enabled', 'application', 'namespace']
};

// const featureFlags: Resource<FeatureFlag> = {
//   name: 'featureFlags',

//   getMany: async () => {
//     return apiService.request<ServiceResponse<FeatureFlag[]>, unknown>({
//       path: `${process.env.NEXT_PUBLIC_API_PATH}/flags`,
//       method: 'GET',
//     });
//   },

//   getOne: async (id: ID) => {
//     const res = await apiService.request<ServiceResponse<FeatureFlag>, unknown>({
//       path: `${process.env.NEXT_PUBLIC_API_PATH}/flags/id/${id}`,
//       method: 'GET',
//     });
//     return res;
//   },
//   update: async (id: ID, data: Partial<FeatureFlag>) => {
//     const numericId = typeof id === 'string' ? Number(id) : id;

//     const response = await apiService.request<FeatureFlag, unknown>({
//       path: `${process.env.NEXT_PUBLIC_API_PATH}/flags/${numericId}`,
//       method: 'PUT',
//       body: data,
//     });

//     return {
//       ...response,
//       data: { data: response.data },
//     };
//   },

//   defaultValues: {
//     id: undefined,
//     name: '',
//     enabled: false,
//     application: '',
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   },

//   requiredFields: ['name', 'enabled'],
// };

// TODO: Refactor templates to use apiService
const templates: Resource<Template> = {
  name: 'templates',

  getMany: async () => {
    return httpClient.request<ServiceResponse<Template[]>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates`,
      method: 'GET',
    });
  },

  getOne: async (identifier: ID) => {
    const res = await httpClient.request<ServiceResponse<Template>, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates/${identifier}`,
      method: 'GET',
    });
    return res;
  },

  update: async (identifier: ID, data: Partial<Template>) => {
    const response = await httpClient.request<Template, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates`,
      method: 'POST',
      body: data,
    });

    return {
      ...response,
      data: { data: response.data },
    };
  },

  create: async (data: Partial<Template>) => {
    const response = await httpClient.request<Template, unknown>({
      path: `${process.env.NEXT_PUBLIC_API_PATH}/templates`,
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

const resources = { featureFlags, templates };
export default resources;
