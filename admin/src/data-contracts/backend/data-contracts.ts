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
  description: string;
  enabled: boolean;
  application: string;
  namespace: string;
}

export interface UpdateFeatureFlagDto {
  id?: number;
  name?: string;
  description?: string;
  enabled?: boolean;
  application?: string;
  namespace?: string;
}

export interface FeatureFlag {
  id: number;
  name: string;
  description: string;
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

export interface RoleUpdateDto {
  displayName?: string;
  namespace?: string;
}

export interface Role {
  id: string;
  name: string;
  displayName?: string;
  namespace?: string;
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
  displayName?: string;
  externalDisplayName?: string;
}

export interface StatusUpdateDto {
  displayName?: string;
  externalDisplayName?: string;
  namespace?: string;
}

export interface Status {
  id: string;
  name: string;
  displayName?: string;
  externalDisplayName?: string;
  namespace?: string;
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

export interface EmailIntegrationDto {
  enabled?: boolean;
  errandClosedEmailSender?: string;
  errandClosedEmailTemplate?: string;
  errandClosedEmailHTMLTemplate?: string;
  errandNewEmailSender?: string;
  errandNewEmailTemplate?: string;
  errandNewEmailHTMLTemplate?: string;
  daysOfInactivityBeforeReject?: number;
  statusForNew?: string;
  triggerStatusChangeOn?: string;
  statusChangeTo?: string;
  inactiveStatus?: string;
  addSenderAsStakeholder?: boolean;
  stakeholderRole?: string;
  errandChannel?: string;
  ignoreAutoReply?: boolean;
  ignoreNoReply?: boolean;
}

export interface EmailIntegration extends EmailIntegrationDto {
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailIntegrationApiResponse {
  data: EmailIntegration;
  message: string;
}

export interface ContactReasonRequestDto {
  reason: string;
  displayName?: string;
  namespace: string;
}

export interface ContactReasonUpdateDto {
  reason?: string;
  displayName?: string;
  namespace?: string;
}

export interface ContactReason {
  id: string;
  reason: string;
  displayName?: string;
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactReasonDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface ContactReasonsApiResponse {
  data: ContactReason[];
  message: string;
}

export interface ContactReasonApiResponse {
  data: ContactReason;
  message: string;
}

export interface CategoryTypeDto {
  name: string;
  displayName?: string;
  escalationEmail?: string;
}

export interface CategoryRequestDto {
  name: string;
  displayName?: string;
  sortOrder?: number;
  types?: CategoryTypeDto[];
  namespace: string;
}

export interface CategoryUpdateDto {
  displayName?: string;
  sortOrder?: number;
  types?: CategoryTypeDto[];
  namespace?: string;
}

export interface CategoryType {
  name: string;
  displayName?: string;
  escalationEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  displayName?: string;
  sortOrder?: number;
  types?: CategoryType[];
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface CategoriesApiResponse {
  data: Category[];
  message: string;
}

export interface CategoryApiResponse {
  data: Category;
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
