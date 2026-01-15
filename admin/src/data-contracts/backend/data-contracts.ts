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
  value?: string;
  enabled: boolean;
  application: string;
  namespace: string;
  municipalityId: number;
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

export interface NamespaceRequestDto {
  namespace?: string;
  displayName?: string;
  shortCode?: string;
  accessControl?: boolean;
  notifyReporter?: boolean;
  notificationTTLInDays?: number;
}

export interface Namespace {
  namespace: string;
  displayName: string;
  shortCode?: string;
  notificationTTLInDays?: number;
  accessControl?: boolean;
  notifyReporter?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NamespaceApiResponse {
  data: Namespace;
  message: string;
}

export interface NamespacesApiResponse {
  data: Namespace[];
  message: string;
}

export interface RoleRequestDto {
  name: string;
  displayName: string;
  namespace: string;
}

export interface Role {
  id: string;
  name: string;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface RolesApiResponse {
  data: Role[];
  message: string;
}

export interface RoleApiResponse {
  data: Role;
  message: string;
}

export interface StatusRequestDto {
  name: string;
  namespace: string;
}

export interface Status {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface StatusesApiResponse {
  data: Status[];
  message: string;
}

export interface StatusApiResponse {
  data: Status;
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
