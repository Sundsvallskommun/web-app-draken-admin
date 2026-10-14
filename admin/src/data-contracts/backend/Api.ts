/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  AttachmentPurposeApiResponse,
  AttachmentPurposeDeleteApiResponse,
  AttachmentPurposeRequestDto,
  AttachmentPurposesApiResponse,
  AttachmentPurposeUpdateDto,
  CategoriesApiResponse,
  CategoryApiResponse,
  CategoryDeleteApiResponse,
  CategoryRequestDto,
  CategoryUpdateDto,
  ContactReasonApiResponse,
  ContactReasonDeleteApiResponse,
  ContactReasonRequestDto,
  ContactReasonsApiResponse,
  ContactReasonUpdateDto,
  DecisionOutcomeApiResponse,
  DecisionOutcomeDeleteApiResponse,
  DecisionOutcomeRequestDto,
  DecisionOutcomesApiResponse,
  DecisionOutcomeUpdateDto,
  DetailedTemplateResponseDTO,
  EmailIntegrationApiResponse,
  EmailIntegrationDto,
  FeatureFlagApiResponse,
  FeatureFlagDeleteApiResponse,
  FeatureFlagRequestDto,
  FeatureFlagsApiResponse,
  JsonSchemaRequestDto,
  LabelsApiResponse,
  MeasureTypeApiResponse,
  MeasureTypeDeleteApiResponse,
  MeasureTypeRequestDto,
  MeasureTypesApiResponse,
  MeasureTypeUpdateDto,
  NamespaceApiResponse,
  NamespaceRequestDto,
  NamespacesApiResponse,
  RoleApiResponse,
  RoleDeleteApiResponse,
  RoleRequestDto,
  RolesApiResponse,
  RoleUpdateDto,
  StatementOutcomeApiResponse,
  StatementOutcomeDeleteApiResponse,
  StatementOutcomeRequestDto,
  StatementOutcomesApiResponse,
  StatementOutcomeUpdateDto,
  StatusApiResponse,
  StatusDeleteApiResponse,
  StatusesApiResponse,
  StatusRequestDto,
  StatusUpdateDto,
  UiSchemaRequestDto,
  UpdateFeatureFlagDto,
  UserApiResponse,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Index
   * @name IndexControllerIndex
   * @summary Index
   * @request GET:/api/
   */
  indexControllerIndex = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerCreateFeatureFlag
   * @summary Create a new feature flag
   * @request POST:/api/featureflags/{municipalityId}
   */
  featureFlagControllerCreateFeatureFlag = (
    municipalityId: number,
    data?: FeatureFlagRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerGetFeatureFlags
   * @summary Get all feature flags
   * @request GET:/api/featureflags/{municipalityId}
   */
  featureFlagControllerGetFeatureFlags = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagsApiResponse, any>({
      path: `/api/featureflags/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerGetFeatureFlag
   * @summary Get a feature flag using id
   * @request GET:/api/featureflags/{municipalityId}/{id}
   */
  featureFlagControllerGetFeatureFlag = (
    municipalityId: number,
    id: number,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags/${municipalityId}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerUpdateFeatureFlag
   * @summary Update a new feature flag
   * @request PUT:/api/featureflags/{municipalityId}/{id}
   */
  featureFlagControllerUpdateFeatureFlag = (
    municipalityId: number,
    id: number,
    data?: UpdateFeatureFlagDto,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags/${municipalityId}/${id}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerDeleteFeatureFlag
   * @summary Delete feature flag
   * @request DELETE:/api/featureflags/{municipalityId}/{namespace}/{id}
   */
  featureFlagControllerDeleteFeatureFlag = (
    municipalityId: number,
    namespace: string,
    id: number,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagDeleteApiResponse, any>({
      path: `/api/featureflags/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Health
   * @name HealthControllerUp
   * @summary Return health check
   * @request GET:/api/health/up
   */
  healthControllerUp = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/health/up`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerGetAllSchemas
   * @summary Get all JSON schemas
   * @request GET:/api/jsonschemas/{municipalityId}
   */
  jsonSchemaControllerGetAllSchemas = (
    municipalityId: number,
    query?: {
      page?: number;
      size?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerCreateSchema
   * @summary Create a new JSON schema
   * @request POST:/api/jsonschemas/{municipalityId}
   */
  jsonSchemaControllerCreateSchema = (
    municipalityId: number,
    data?: JsonSchemaRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerGetSchema
   * @summary Get a JSON schema by ID
   * @request GET:/api/jsonschemas/{municipalityId}/{id}
   */
  jsonSchemaControllerGetSchema = (
    municipalityId: number,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerDeleteSchema
   * @summary Delete a JSON schema
   * @request DELETE:/api/jsonschemas/{municipalityId}/{id}
   */
  jsonSchemaControllerDeleteSchema = (
    municipalityId: number,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerGetUiSchema
   * @summary Get UI schema for a JSON schema
   * @request GET:/api/jsonschemas/{municipalityId}/{id}/ui-schema
   */
  jsonSchemaControllerGetUiSchema = (
    municipalityId: number,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}/${id}/ui-schema`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerUpdateUiSchema
   * @summary Create or update UI schema
   * @request PUT:/api/jsonschemas/{municipalityId}/{id}/ui-schema
   */
  jsonSchemaControllerUpdateUiSchema = (
    municipalityId: number,
    id: string,
    data?: UiSchemaRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}/${id}/ui-schema`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Json Schema
   * @name JsonSchemaControllerDeleteUiSchema
   * @summary Delete UI schema
   * @request DELETE:/api/jsonschemas/{municipalityId}/{id}/ui-schema
   */
  jsonSchemaControllerDeleteUiSchema = (
    municipalityId: number,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/jsonschemas/${municipalityId}/${id}/ui-schema`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Labels
   * @name LabelsControllerGetLabels
   * @summary Get labels for a namespace
   * @request GET:/api/labels/{municipalityId}/{namespace}
   */
  labelsControllerGetLabels = (
    municipalityId: number,
    namespace: string,
    params: RequestParams = {},
  ) =>
    this.request<LabelsApiResponse, any>({
      path: `/api/labels/${municipalityId}/${namespace}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Labels
   * @name LabelsControllerCreateLabels
   * @summary Create labels for a namespace
   * @request POST:/api/labels/{municipalityId}/{namespace}
   */
  labelsControllerCreateLabels = (
    municipalityId: number,
    namespace: string,
    data?: any,
    params: RequestParams = {},
  ) =>
    this.request<LabelsApiResponse, any>({
      path: `/api/labels/${municipalityId}/${namespace}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Labels
   * @name LabelsControllerUpdateLabels
   * @summary Update labels for a namespace
   * @request PUT:/api/labels/{municipalityId}/{namespace}
   */
  labelsControllerUpdateLabels = (
    municipalityId: number,
    namespace: string,
    data?: any,
    params: RequestParams = {},
  ) =>
    this.request<LabelsApiResponse, any>({
      path: `/api/labels/${municipalityId}/${namespace}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Namespace
   * @name NamespaceControllerCreateNamespace
   * @summary Create a namespace
   * @request POST:/api/namespaces/{municipalityId}
   */
  namespaceControllerCreateNamespace = (
    municipalityId: number,
    data?: NamespaceRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<NamespaceApiResponse, any>({
      path: `/api/namespaces/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Namespace
   * @name NamespaceControllerGetSupportManagementNamespaces
   * @summary Get all namespaces
   * @request GET:/api/namespaces/{municipalityId}
   */
  namespaceControllerGetSupportManagementNamespaces = (
    municipalityId: number,
    params: RequestParams = {},
  ) =>
    this.request<NamespacesApiResponse, any>({
      path: `/api/namespaces/${municipalityId}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Namespace
   * @name NamespaceControllerUpdateNamespace
   * @summary Update a namespace
   * @request PUT:/api/namespaces/{municipalityId}/{namespace}
   */
  namespaceControllerUpdateNamespace = (
    municipalityId: number,
    namespace: string,
    data?: NamespaceRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<NamespaceApiResponse, any>({
      path: `/api/namespaces/${municipalityId}/${namespace}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Namespace
   * @name NamespaceControllerGetNamespace
   * @summary Get a namespace using a namespace name
   * @request GET:/api/namespaces/{municipalityId}/{namespace}
   */
  namespaceControllerGetNamespace = (
    municipalityId: number,
    namespace: string,
    params: RequestParams = {},
  ) =>
    this.request<NamespaceApiResponse, any>({
      path: `/api/namespaces/${municipalityId}/${namespace}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Namespace
   * @name NamespaceControllerGetNamespaces
   * @summary Get all namespaces, including casedata
   * @request GET:/api/namespaces/{municipalityId}/all
   */
  namespaceControllerGetNamespaces = (
    municipalityId: number,
    params: RequestParams = {},
  ) =>
    this.request<NamespacesApiResponse, any>({
      path: `/api/namespaces/${municipalityId}/all`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerCreateRole
   * @summary Create new role
   * @request POST:/api/roles/{municipalityId}
   */
  rolesControllerCreateRole = (
    municipalityId: number,
    data?: RoleRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<RoleApiResponse, any>({
      path: `/api/roles/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerGetRoles
   * @summary Get all roles
   * @request GET:/api/roles/{municipalityId}
   */
  rolesControllerGetRoles = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<RolesApiResponse, any>({
      path: `/api/roles/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerGetRole
   * @summary Get a role by UUID
   * @request GET:/api/roles/{municipalityId}/{namespace}/{id}
   */
  rolesControllerGetRole = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<RoleApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerUpdateRole
   * @summary Update a role by UUID
   * @request PATCH:/api/roles/{municipalityId}/{namespace}/{id}
   */
  rolesControllerUpdateRole = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: RoleUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<RoleApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerDeleteRole
   * @summary Delete role
   * @request DELETE:/api/roles/{municipalityId}/{namespace}/{id}
   */
  rolesControllerDeleteRole = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<RoleDeleteApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerCreateStatus
   * @summary Create new status
   * @request POST:/api/statuses/{municipalityId}
   */
  statusesControllerCreateStatus = (
    municipalityId: number,
    data?: StatusRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<StatusApiResponse, any>({
      path: `/api/statuses/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerGetStatuses
   * @summary Get all statuses
   * @request GET:/api/statuses/{municipalityId}
   */
  statusesControllerGetStatuses = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<StatusesApiResponse, any>({
      path: `/api/statuses/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerGetStatus
   * @summary Get a status by UUID
   * @request GET:/api/statuses/{municipalityId}/{namespace}/{id}
   */
  statusesControllerGetStatus = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<StatusApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerUpdateStatus
   * @summary Update a status by UUID
   * @request PATCH:/api/statuses/{municipalityId}/{namespace}/{id}
   */
  statusesControllerUpdateStatus = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: StatusUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<StatusApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerDeleteStatus
   * @summary Delete status
   * @request DELETE:/api/statuses/{municipalityId}/{namespace}/{id}
   */
  statusesControllerDeleteStatus = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<StatusDeleteApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Attachment Purposes
   * @name AttachmentPurposesControllerCreateAttachmentPurpose
   * @summary Create new attachment purpose
   * @request POST:/api/attachment-purposes/{municipalityId}
   */
  attachmentPurposesControllerCreateAttachmentPurpose = (
    municipalityId: number,
    data?: AttachmentPurposeRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<AttachmentPurposeApiResponse, any>({
      path: `/api/attachment-purposes/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Attachment Purposes
   * @name AttachmentPurposesControllerGetAttachmentPurposes
   * @summary Get all attachment purposes
   * @request GET:/api/attachment-purposes/{municipalityId}
   */
  attachmentPurposesControllerGetAttachmentPurposes = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<AttachmentPurposesApiResponse, any>({
      path: `/api/attachment-purposes/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Attachment Purposes
   * @name AttachmentPurposesControllerGetAttachmentPurpose
   * @summary Get an attachment purpose by UUID
   * @request GET:/api/attachment-purposes/{municipalityId}/{namespace}/{id}
   */
  attachmentPurposesControllerGetAttachmentPurpose = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<AttachmentPurposeApiResponse, any>({
      path: `/api/attachment-purposes/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Attachment Purposes
   * @name AttachmentPurposesControllerUpdateAttachmentPurpose
   * @summary Update an attachment purpose by UUID
   * @request PATCH:/api/attachment-purposes/{municipalityId}/{namespace}/{id}
   */
  attachmentPurposesControllerUpdateAttachmentPurpose = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: AttachmentPurposeUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<AttachmentPurposeApiResponse, any>({
      path: `/api/attachment-purposes/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Attachment Purposes
   * @name AttachmentPurposesControllerDeleteAttachmentPurpose
   * @summary Delete an attachment purpose by UUID
   * @request DELETE:/api/attachment-purposes/{municipalityId}/{namespace}/{id}
   */
  attachmentPurposesControllerDeleteAttachmentPurpose = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<AttachmentPurposeDeleteApiResponse, any>({
      path: `/api/attachment-purposes/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Measure Types
   * @name MeasureTypesControllerCreateMeasureType
   * @summary Create new measure type
   * @request POST:/api/measure-types/{municipalityId}
   */
  measureTypesControllerCreateMeasureType = (
    municipalityId: number,
    data?: MeasureTypeRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<MeasureTypeApiResponse, any>({
      path: `/api/measure-types/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Measure Types
   * @name MeasureTypesControllerGetMeasureTypes
   * @summary Get all measure types
   * @request GET:/api/measure-types/{municipalityId}
   */
  measureTypesControllerGetMeasureTypes = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<MeasureTypesApiResponse, any>({
      path: `/api/measure-types/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Measure Types
   * @name MeasureTypesControllerGetMeasureType
   * @summary Get a measure type by UUID
   * @request GET:/api/measure-types/{municipalityId}/{namespace}/{id}
   */
  measureTypesControllerGetMeasureType = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<MeasureTypeApiResponse, any>({
      path: `/api/measure-types/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Measure Types
   * @name MeasureTypesControllerUpdateMeasureType
   * @summary Update a measure type by UUID
   * @request PATCH:/api/measure-types/{municipalityId}/{namespace}/{id}
   */
  measureTypesControllerUpdateMeasureType = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: MeasureTypeUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<MeasureTypeApiResponse, any>({
      path: `/api/measure-types/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Measure Types
   * @name MeasureTypesControllerDeleteMeasureType
   * @summary Delete a measure type by UUID
   * @request DELETE:/api/measure-types/{municipalityId}/{namespace}/{id}
   */
  measureTypesControllerDeleteMeasureType = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<MeasureTypeDeleteApiResponse, any>({
      path: `/api/measure-types/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Decision Outcomes
   * @name DecisionOutcomesControllerCreateDecisionOutcome
   * @summary Create new decision outcome
   * @request POST:/api/decision-outcomes/{municipalityId}
   */
  decisionOutcomesControllerCreateDecisionOutcome = (
    municipalityId: number,
    data?: DecisionOutcomeRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<DecisionOutcomeApiResponse, any>({
      path: `/api/decision-outcomes/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Decision Outcomes
   * @name DecisionOutcomesControllerGetDecisionOutcomes
   * @summary Get all decision outcomes
   * @request GET:/api/decision-outcomes/{municipalityId}
   */
  decisionOutcomesControllerGetDecisionOutcomes = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<DecisionOutcomesApiResponse, any>({
      path: `/api/decision-outcomes/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Decision Outcomes
   * @name DecisionOutcomesControllerGetDecisionOutcome
   * @summary Get a decision outcome by UUID
   * @request GET:/api/decision-outcomes/{municipalityId}/{namespace}/{id}
   */
  decisionOutcomesControllerGetDecisionOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<DecisionOutcomeApiResponse, any>({
      path: `/api/decision-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Decision Outcomes
   * @name DecisionOutcomesControllerUpdateDecisionOutcome
   * @summary Update a decision outcome by UUID
   * @request PATCH:/api/decision-outcomes/{municipalityId}/{namespace}/{id}
   */
  decisionOutcomesControllerUpdateDecisionOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: DecisionOutcomeUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<DecisionOutcomeApiResponse, any>({
      path: `/api/decision-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Decision Outcomes
   * @name DecisionOutcomesControllerDeleteDecisionOutcome
   * @summary Delete a decision outcome by UUID
   * @request DELETE:/api/decision-outcomes/{municipalityId}/{namespace}/{id}
   */
  decisionOutcomesControllerDeleteDecisionOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<DecisionOutcomeDeleteApiResponse, any>({
      path: `/api/decision-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statement Outcomes
   * @name StatementOutcomesControllerCreateStatementOutcome
   * @summary Create new statement outcome
   * @request POST:/api/statement-outcomes/{municipalityId}
   */
  statementOutcomesControllerCreateStatementOutcome = (
    municipalityId: number,
    data?: StatementOutcomeRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<StatementOutcomeApiResponse, any>({
      path: `/api/statement-outcomes/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statement Outcomes
   * @name StatementOutcomesControllerGetStatementOutcomes
   * @summary Get all statement outcomes
   * @request GET:/api/statement-outcomes/{municipalityId}
   */
  statementOutcomesControllerGetStatementOutcomes = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<StatementOutcomesApiResponse, any>({
      path: `/api/statement-outcomes/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statement Outcomes
   * @name StatementOutcomesControllerGetStatementOutcome
   * @summary Get a statement outcome by UUID
   * @request GET:/api/statement-outcomes/{municipalityId}/{namespace}/{id}
   */
  statementOutcomesControllerGetStatementOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<StatementOutcomeApiResponse, any>({
      path: `/api/statement-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statement Outcomes
   * @name StatementOutcomesControllerUpdateStatementOutcome
   * @summary Update a statement outcome by UUID
   * @request PATCH:/api/statement-outcomes/{municipalityId}/{namespace}/{id}
   */
  statementOutcomesControllerUpdateStatementOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: StatementOutcomeUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<StatementOutcomeApiResponse, any>({
      path: `/api/statement-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Statement Outcomes
   * @name StatementOutcomesControllerDeleteStatementOutcome
   * @summary Delete a statement outcome by UUID
   * @request DELETE:/api/statement-outcomes/{municipalityId}/{namespace}/{id}
   */
  statementOutcomesControllerDeleteStatementOutcome = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<StatementOutcomeDeleteApiResponse, any>({
      path: `/api/statement-outcomes/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesControllerCreateCategory
   * @summary Create new category
   * @request POST:/api/categories/{municipalityId}
   */
  categoriesControllerCreateCategory = (
    municipalityId: number,
    data?: CategoryRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<CategoryApiResponse, any>({
      path: `/api/categories/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesControllerGetCategories
   * @summary Get all categories
   * @request GET:/api/categories/{municipalityId}
   */
  categoriesControllerGetCategories = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<CategoriesApiResponse, any>({
      path: `/api/categories/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesControllerGetCategory
   * @summary Get a category by name
   * @request GET:/api/categories/{municipalityId}/{namespace}/{id}
   */
  categoriesControllerGetCategory = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<CategoryApiResponse, any>({
      path: `/api/categories/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesControllerUpdateCategory
   * @summary Update a category by name
   * @request PATCH:/api/categories/{municipalityId}/{namespace}/{id}
   */
  categoriesControllerUpdateCategory = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: CategoryUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<CategoryApiResponse, any>({
      path: `/api/categories/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Categories
   * @name CategoriesControllerDeleteCategory
   * @summary Delete category
   * @request DELETE:/api/categories/{municipalityId}/{namespace}/{id}
   */
  categoriesControllerDeleteCategory = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<CategoryDeleteApiResponse, any>({
      path: `/api/categories/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Compare
   * @name CompareControllerCheckAvailable
   * @summary Check if environment comparison is configured
   * @request GET:/api/compare/available
   */
  compareControllerCheckAvailable = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/compare/available`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Compare
   * @name CompareControllerCompareTemplates
   * @summary Compare templates between local and compare environment
   * @request GET:/api/compare/templates/{municipalityId}
   */
  compareControllerCompareTemplates = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/compare/templates/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Contact Reasons
   * @name ContactReasonsControllerCreateContactReason
   * @summary Create new contact reason
   * @request POST:/api/contact-reasons/{municipalityId}
   */
  contactReasonsControllerCreateContactReason = (
    municipalityId: number,
    data?: ContactReasonRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Contact Reasons
   * @name ContactReasonsControllerGetContactReasons
   * @summary Get all contact reasons
   * @request GET:/api/contact-reasons/{municipalityId}
   */
  contactReasonsControllerGetContactReasons = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonsApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Contact Reasons
   * @name ContactReasonsControllerGetContactReason
   * @summary Get a contact reason by UUID
   * @request GET:/api/contact-reasons/{municipalityId}/{namespace}/{id}
   */
  contactReasonsControllerGetContactReason = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}/${namespace}/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Contact Reasons
   * @name ContactReasonsControllerUpdateContactReason
   * @summary Update a contact reason by UUID
   * @request PATCH:/api/contact-reasons/{municipalityId}/{namespace}/{id}
   */
  contactReasonsControllerUpdateContactReason = (
    municipalityId: number,
    namespace: string,
    id: string,
    data?: ContactReasonUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}/${namespace}/${id}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Contact Reasons
   * @name ContactReasonsControllerDeleteContactReason
   * @summary Delete contact reason
   * @request DELETE:/api/contact-reasons/{municipalityId}/{namespace}/{id}
   */
  contactReasonsControllerDeleteContactReason = (
    municipalityId: number,
    namespace: string,
    id: string,
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonDeleteApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}/${namespace}/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Email Integration
   * @name EmailIntegrationControllerGetEmailIntegration
   * @summary Get email integration config for a namespace
   * @request GET:/api/email-integration/{municipalityId}/{namespace}
   */
  emailIntegrationControllerGetEmailIntegration = (
    municipalityId: number,
    namespace: string,
    params: RequestParams = {},
  ) =>
    this.request<EmailIntegrationApiResponse, any>({
      path: `/api/email-integration/${municipalityId}/${namespace}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Email Integration
   * @name EmailIntegrationControllerUpdateEmailIntegration
   * @summary Update email integration config for a namespace
   * @request PUT:/api/email-integration/{municipalityId}/{namespace}
   */
  emailIntegrationControllerUpdateEmailIntegration = (
    municipalityId: number,
    namespace: string,
    data?: EmailIntegrationDto,
    params: RequestParams = {},
  ) =>
    this.request<EmailIntegrationApiResponse, any>({
      path: `/api/email-integration/${municipalityId}/${namespace}`,
      method: "PUT",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Environment
   * @name EnvironmentControllerGetAdminEnvironment
   * @summary Get current admin environment
   * @request GET:/api/admin/environment
   */
  environmentControllerGetAdminEnvironment = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/admin/environment`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerGetAllTemplates
   * @summary Get the latest version of templates
   * @request GET:/api/templates/{municipalityId}
   */
  templateControllerGetAllTemplates = (
    municipalityId: number,
    query?: {
      namespace?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerDecisionPreviewDirectPdf
   * @summary Store a template
   * @request POST:/api/templates/{municipalityId}
   */
  templateControllerDecisionPreviewDirectPdf = (
    municipalityId: number,
    data?: DetailedTemplateResponseDTO,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates/${municipalityId}`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerGetTemplateUsingIdentifier
   * @summary Get the latest version of a template by identifier, including content
   * @request GET:/api/templates/{municipalityId}/{identifier}
   */
  templateControllerGetTemplateUsingIdentifier = (
    municipalityId: number,
    identifier: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates/${municipalityId}/${identifier}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerPreviewDirectPdf
   * @summary Render pdf preview of decision from passed in template string
   * @request POST:/api/templates/render
   */
  templateControllerPreviewDirectPdf = (
    data?: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates/render`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags User
   * @name UserControllerGetUser
   * @summary Return current user
   * @request GET:/api/me
   */
  userControllerGetUser = (params: RequestParams = {}) =>
    this.request<UserApiResponse, any>({
      path: `/api/me`,
      method: "GET",
      ...params,
    });
}
