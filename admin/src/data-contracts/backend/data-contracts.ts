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
  name: string;
  description: string;
  enabled: boolean;
  application: string;
  namespace: string;
}

export interface UpdateFeatureFlagDto {
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

export interface JsonSchemaRequestDto {
  /** @minLength 1 */
  name: string;
  /** @pattern ^(\d+\.)?(\d+)$ */
  version: string;
  value: object;
  description?: string;
}

export interface UiSchemaRequestDto {
  value: object;
  description?: string;
}

export interface LabelAttribute {
  key: string;
  value: string;
}

export interface Label {
  id?: string;
  classification: string;
  displayName?: string;
  resourceName: string;
  resourcePath?: string;
  deprecated?: boolean;
  isLeaf?: boolean;
  labels?: Label[];
  attributes?: LabelAttribute[];
}

export interface LabelsApiResponse {
  data: Label[];
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
  namespace: string;
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
  namespace: string;
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

export interface AttachmentPurposeRequestDto {
  name: string;
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace: string;
}

export interface AttachmentPurposeUpdateDto {
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
}

export interface AttachmentPurpose {
  id: string;
  name: string;
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttachmentPurposeDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface AttachmentPurposesApiResponse {
  data: AttachmentPurpose[];
  message: string;
}

export interface AttachmentPurposeApiResponse {
  data: AttachmentPurpose;
  message: string;
}

export interface MeasureTypeRequestDto {
  name: string;
  displayName?: string;
  /** @minItems 1 */
  measureGroups: string[];
  sortOrder?: number;
  deprecated?: boolean;
  namespace: string;
}

export interface MeasureTypeUpdateDto {
  displayName?: string;
  /** @minItems 1 */
  measureGroups?: string[];
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
}

export interface MeasureType {
  id: string;
  name: string;
  displayName?: string;
  measureGroups: string[];
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasureTypeDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface MeasureTypesApiResponse {
  data: MeasureType[];
  message: string;
}

export interface MeasureTypeApiResponse {
  data: MeasureType;
  message: string;
}

export interface DecisionOutcomeRequestDto {
  name: string;
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace: string;
}

export interface DecisionOutcomeUpdateDto {
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
}

export interface DecisionOutcome {
  id: string;
  name: string;
  displayName?: string;
  sortOrder?: number;
  deprecated?: boolean;
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DecisionOutcomeDeleteApiResponse {
  data: boolean;
  message: string;
}

export interface DecisionOutcomesApiResponse {
  data: DecisionOutcome[];
  message: string;
}

export interface DecisionOutcomeApiResponse {
  data: DecisionOutcome;
  message: string;
}

export interface CategoryTypeDto {
  name: string;
  displayName?: string;
  /** @format email */
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
  namespace: string;
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

export interface ContactReasonRequestDto {
  reason: string;
  displayName?: string;
  namespace: string;
}

export interface ContactReasonUpdateDto {
  reason?: string;
  displayName?: string;
  namespace: string;
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

export interface EmailIntegrationDto {
  enabled: boolean;
  errandClosedEmailSender?: string;
  errandClosedEmailTemplate?: string;
  errandClosedEmailHTMLTemplate?: string;
  errandNewEmailSender?: string;
  errandNewEmailTemplate?: string;
  errandNewEmailHTMLTemplate?: string;
  daysOfInactivityBeforeReject?: number;
  statusForNew: string;
  triggerStatusChangeOn?: string;
  statusChangeTo?: string;
  inactiveStatus?: string;
  addSenderAsStakeholder?: boolean;
  stakeholderRole?: string;
  errandChannel?: string;
  ignoreAutoReply: boolean;
  ignoreNoReply: boolean;
}

export interface EmailIntegrationData {
  enabled: boolean;
  errandClosedEmailSender?: string;
  errandClosedEmailTemplate?: string;
  errandClosedEmailHTMLTemplate?: string;
  errandNewEmailSender?: string;
  errandNewEmailTemplate?: string;
  errandNewEmailHTMLTemplate?: string;
  daysOfInactivityBeforeReject?: number;
  statusForNew: string;
  triggerStatusChangeOn?: string;
  statusChangeTo?: string;
  inactiveStatus?: string;
  addSenderAsStakeholder?: boolean;
  stakeholderRole?: string;
  errandChannel?: string;
  ignoreAutoReply: boolean;
  ignoreNoReply: boolean;
  namespace?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailIntegrationApiResponse {
  data: EmailIntegrationData;
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
