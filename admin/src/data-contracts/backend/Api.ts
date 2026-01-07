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
  DetailedTemplateResponseDTO,
  FeatureFlagApiResponse,
  FeatureFlagDeleteApiResponse,
  FeatureFlagRequestDto,
  FeatureFlagsApiResponse,
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
   * @tags Template
   * @name TemplateControllerGetTemplateUsingIdentifier
   * @summary Get the latest version of a template by identifier, including content
   * @request GET:/api/templates/{identifier}
   */
  templateControllerGetTemplateUsingIdentifier = (
    identifier: string,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates/${identifier}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerGetAllTemplates
   * @summary Get the latest version of templates
   * @request GET:/api/templates
   */
  templateControllerGetAllTemplates = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/api/templates`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Template
   * @name TemplateControllerDecisionPreviewDirectPdf
   * @summary Store a template
   * @request POST:/api/templates
   */
  templateControllerDecisionPreviewDirectPdf = (
    data?: DetailedTemplateResponseDTO,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/api/templates`,
      method: "POST",
      body: data,
      type: ContentType.Json,
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
   * @tags Feature Flag
   * @name FeatureFlagControllerCreateFeatureFlag
   * @summary Create a new feature flag
   * @request POST:/api/featureflags
   */
  featureFlagControllerCreateFeatureFlag = (
    data?: FeatureFlagRequestDto,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags`,
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
   * @request GET:/api/featureflags
   */
  featureFlagControllerGetFeatureFlags = (params: RequestParams = {}) =>
    this.request<FeatureFlagsApiResponse, any>({
      path: `/api/featureflags`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerGetFeatureFlag
   * @summary Get a feature flag using id
   * @request GET:/api/featureflags/{id}
   */
  featureFlagControllerGetFeatureFlag = (
    id: number,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Feature Flag
   * @name FeatureFlagControllerUpdateFeatureFlag
   * @summary Update a new feature flag
   * @request PUT:/api/featureflags/{id}
   */
  featureFlagControllerUpdateFeatureFlag = (
    id: number,
    data?: UpdateFeatureFlagDto,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagApiResponse, any>({
      path: `/api/featureflags/${id}`,
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
   * @request DELETE:/api/featureflags/{id}
   */
  featureFlagControllerDeleteFeatureFlag = (
    id: number,
    params: RequestParams = {},
  ) =>
    this.request<FeatureFlagDeleteApiResponse, any>({
      path: `/api/featureflags/${id}`,
      method: "DELETE",
      ...params,
    });
}
