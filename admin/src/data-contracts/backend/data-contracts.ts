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

export interface FeatureFlagRequestDto {
  id?: number;
  name: string;
  enabled: boolean;
  application: string;
  namespace: string;
}

export interface UpdateFeatureFlagDto {
  id?: number;
  name?: string;
  enabled?: boolean;
  application?: string;
  namespace?: string;
}

export interface FeatureFlag {
  id: number;
  name: string;
  enabled: boolean;
  application: string;
  namespace: string;
}

export interface FeatureFlagDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface FeatureFlagsApiResponse {
  data: FeatureFlag[];
  message: string;
}

export interface FeatureFlagApiResponse {
  data: FeatureFlag;
  message: string;
}

export interface Namespace {
  namespace: string;
  displayName: string;
}

export interface NamespacesApiResponse {
  data: Namespace[];
  message: string;
}

export interface DetailedTemplateResponseDTO {
  identifier?: string;
  version?: string;
  type?: "PEBBLE" | "WORD";
  name?: string;
  description?: string;
  metadata?: string;
  defaultValues?: string;
  changeLog?: string;
  lastModifiedAt?: string;
  content?: string;
}

export interface Permissions {
  canUseAdminPanel: boolean;
}

export interface User {
  name: string;
  username: string;
  permissions: Permissions;
}

export interface UserApiResponse {
  data: User;
  message: string;
}
