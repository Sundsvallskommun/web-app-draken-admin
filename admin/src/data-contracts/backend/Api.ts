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
  DetailedTemplateResponseDTO,
  EmailIntegrationApiResponse,
  EmailIntegrationDto,
  FeatureFlagApiResponse,
  FeatureFlagDeleteApiResponse,
  FeatureFlagRequestDto,
  FeatureFlagsApiResponse,
  NamespaceApiResponse,
  NamespaceRequestDto,
  NamespacesApiResponse,
  RoleApiResponse,
  RoleDeleteApiResponse,
  RoleRequestDto,
  RoleUpdateDto,
  RolesApiResponse,
  StatusApiResponse,
  StatusDeleteApiResponse,
  StatusesApiResponse,
  StatusRequestDto,
  StatusUpdateDto,
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
   * @tags ContactReasons
   * @name ContactReasonsControllerCreateContactReason
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
   * @tags ContactReasons
   * @name ContactReasonsControllerGetContactReasons
   * @request GET:/api/contact-reasons/{municipalityId}
   */
  contactReasonsControllerGetContactReasons = (
    municipalityId: number,
    query?: { namespace?: string },
    params: RequestParams = {},
  ) =>
    this.request<ContactReasonsApiResponse, any>({
      path: `/api/contact-reasons/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @tags ContactReasons
   * @name ContactReasonsControllerGetContactReason
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
   * @tags ContactReasons
   * @name ContactReasonsControllerUpdateContactReason
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
   * @tags ContactReasons
   * @name ContactReasonsControllerDeleteContactReason
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
   * @tags Categories
   * @name CategoriesControllerCreateCategory
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
   * @tags Categories
   * @name CategoriesControllerGetCategories
   * @request GET:/api/categories/{municipalityId}
   */
  categoriesControllerGetCategories = (
    municipalityId: number,
    query?: { namespace?: string },
    params: RequestParams = {},
  ) =>
    this.request<CategoriesApiResponse, any>({
      path: `/api/categories/${municipalityId}`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @tags Categories
   * @name CategoriesControllerGetCategory
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
   * @tags Categories
   * @name CategoriesControllerUpdateCategory
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
   * @tags Categories
   * @name CategoriesControllerDeleteCategory
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
   * @tags EmailIntegration
   * @name EmailIntegrationControllerGetEmailIntegration
   * @summary Get email integration config
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
   * @tags EmailIntegration
   * @name EmailIntegrationControllerUpdateEmailIntegration
   * @summary Update email integration config
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
   * @name RolesControllerDeleteRole
   * @summary Delete role
   * @request DELETE:/api/roles/{municipalityId}/{namespace}/{role}
   */
  rolesControllerDeleteRole = (
    municipalityId: number,
    namespace: string,
    role: string,
    params: RequestParams = {},
  ) =>
    this.request<RoleDeleteApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${role}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerGetRole
   * @summary Get a role
   * @request GET:/api/roles/{municipalityId}/{namespace}/{role}
   */
  rolesControllerGetRole = (
    municipalityId: number,
    namespace: string,
    role: string,
    params: RequestParams = {},
  ) =>
    this.request<RoleApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${role}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Roles
   * @name RolesControllerUpdateRole
   * @summary Update a role
   * @request PATCH:/api/roles/{municipalityId}/{namespace}/{role}
   */
  rolesControllerUpdateRole = (
    municipalityId: number,
    namespace: string,
    role: string,
    data?: RoleUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<RoleApiResponse, any>({
      path: `/api/roles/${municipalityId}/${namespace}/${role}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
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
   * @name StatusesControllerDeleteStatus
   * @summary Delete status
   * @request DELETE:/api/statuses/{municipalityId}/{namespace}/{status}
   */
  statusesControllerDeleteStatus = (
    municipalityId: number,
    namespace: string,
    status: string,
    params: RequestParams = {},
  ) =>
    this.request<StatusDeleteApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${status}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerGetStatus
   * @summary Get a status
   * @request GET:/api/statuses/{municipalityId}/{namespace}/{status}
   */
  statusesControllerGetStatus = (
    municipalityId: number,
    namespace: string,
    status: string,
    params: RequestParams = {},
  ) =>
    this.request<StatusApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${status}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Statuses
   * @name StatusesControllerUpdateStatus
   * @summary Update a status
   * @request PATCH:/api/statuses/{municipalityId}/{namespace}/{status}
   */
  statusesControllerUpdateStatus = (
    municipalityId: number,
    namespace: string,
    status: string,
    data?: StatusUpdateDto,
    params: RequestParams = {},
  ) =>
    this.request<StatusApiResponse, any>({
      path: `/api/statuses/${municipalityId}/${namespace}/${status}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
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
