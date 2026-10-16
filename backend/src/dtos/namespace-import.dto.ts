import { Type } from 'class-transformer';
import { ArrayNotEmpty, Equals, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Min, ValidateNested } from 'class-validator';

/**
 * The namespace import/export document.
 *
 * One JSON document describes a whole supportmanagement namespace: its config, every
 * namespace-scoped metadata kind, the label tree, the email integration and the admin's
 * own feature flags. `POST /namespaces/:municipalityId/import` consumes it and
 * `GET /namespaces/:municipalityId/:namespace/export` produces it, so the two round-trip.
 *
 * The item classes mirror the per-kind request DTOs (dtos/status.dto.ts etc.) WITHOUT the
 * per-item `namespace` field - the namespace is top-level here. Keep them in sync when a
 * request DTO gains a field. Gateway-only fields such as `sortOrder` and `deprecated` are
 * included so an export is lossless.
 */

export const NAMESPACE_IMPORT_FORMAT_VERSION = '1';

/** Pattern the gateway uses for label resource names. */
export const LABEL_RESOURCE_NAME_PATTERN = /^[A-Z0-9_]+$/;
/** What we accept in the namespace URL segment. */
export const NAMESPACE_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// Mirrors NamespaceRequestDto (dtos/namespace.dto.ts) without namespace. displayName and
// shortCode are required here because the gateway's NamespaceConfig requires them.
export class NamespaceConfigImportDto {
  @IsString()
  displayName: string;
  @IsString()
  shortCode: string;
  @IsInt()
  @Min(0)
  @IsOptional()
  notificationTTLInDays?: number;
  @IsBoolean()
  @IsOptional()
  accessControl?: boolean;
  @IsBoolean()
  @IsOptional()
  notifyReporter?: boolean;
}

// Mirrors StatusRequestDto (dtos/status.dto.ts) without namespace.
export class StatusImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  externalDisplayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors RoleRequestDto (dtos/role.dto.ts) without namespace.
export class RoleImportDto {
  @IsString()
  name: string;
  @IsString()
  displayName: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors CategoryTypeDto (dtos/category.dto.ts). escalationEmail is a plain string here so
// a real export can always be re-imported; validateNamespaceImport warns on odd values and
// the gateway enforces its own email format.
export class CategoryTypeImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  escalationEmail?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors CategoryRequestDto (dtos/category.dto.ts) without namespace.
export class CategoryImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTypeImportDto)
  @IsOptional()
  types?: CategoryTypeImportDto[];
}

// Mirrors ContactReasonRequestDto (dtos/contact-reason.dto.ts) without namespace.
export class ContactReasonImportDto {
  @IsString()
  reason: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors AttachmentPurposeRequestDto (dtos/attachment-purpose.dto.ts) without namespace.
export class AttachmentPurposeImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors MeasureTypeRequestDto (dtos/measure-type.dto.ts) without namespace.
export class MeasureTypeImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  measureGroups: string[];
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors DecisionOutcomeRequestDto (dtos/decision-outcome.dto.ts) without namespace.
export class DecisionOutcomeImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

// Mirrors StatementOutcomeRequestDto (dtos/statement-outcome.dto.ts) without namespace.
export class StatementOutcomeImportDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  responded?: boolean;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
}

export class LabelAttributeImportDto {
  @IsString()
  key: string;
  @IsString()
  value: string;
}

// The label tree as the gateway stores it (data-contracts Label), minus ids, versions and
// the derived resourcePath.
export class LabelImportDto {
  @IsString()
  classification: string;
  @IsString()
  resourceName: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabelImportDto)
  @IsOptional()
  labels?: LabelImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabelAttributeImportDto)
  @IsOptional()
  attributes?: LabelAttributeImportDto[];
}

// Mirrors EmailIntegrationDto (dtos/email-integration.dto.ts).
export class EmailIntegrationImportDto {
  @IsBoolean()
  enabled: boolean;
  @IsString()
  @IsOptional()
  errandClosedEmailSender?: string;
  @IsString()
  @IsOptional()
  errandClosedEmailTemplate?: string;
  @IsString()
  @IsOptional()
  errandClosedEmailHTMLTemplate?: string;
  @IsString()
  @IsOptional()
  errandNewEmailSender?: string;
  @IsString()
  @IsOptional()
  errandNewEmailTemplate?: string;
  @IsString()
  @IsOptional()
  errandNewEmailHTMLTemplate?: string;
  @IsNumber()
  @IsOptional()
  daysOfInactivityBeforeReject?: number;
  @IsString()
  statusForNew: string;
  @IsString()
  @IsOptional()
  triggerStatusChangeOn?: string;
  @IsString()
  @IsOptional()
  statusChangeTo?: string;
  @IsString()
  @IsOptional()
  inactiveStatus?: string;
  @IsBoolean()
  @IsOptional()
  addSenderAsStakeholder?: boolean;
  @IsString()
  @IsOptional()
  stakeholderRole?: string;
  @IsString()
  @IsOptional()
  errandChannel?: string;
  @IsBoolean()
  ignoreAutoReply: boolean;
  @IsBoolean()
  ignoreNoReply: boolean;
}

// Mirrors FeatureFlagRequestDto (dtos/featureflag.dto.ts) without namespace. Stored in the
// admin's own database, never sent to the gateway.
export class FeatureFlagImportDto {
  @IsString()
  name: string;
  @IsString()
  description: string;
  @IsBoolean()
  enabled: boolean;
  @IsString()
  application: string;
}

export class NamespaceImportDto {
  @Equals(NAMESPACE_IMPORT_FORMAT_VERSION)
  formatVersion: '1';
  /** When the document was exported. Informational only. */
  @IsString()
  @IsOptional()
  exportedAt?: string;
  /** Goes into the gateway URL path, so it is restricted to URL-safe characters. */
  @IsString()
  @Matches(NAMESPACE_NAME_PATTERN)
  namespace: string;
  @ValidateNested()
  @Type(() => NamespaceConfigImportDto)
  config: NamespaceConfigImportDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatusImportDto)
  @IsOptional()
  statuses?: StatusImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleImportDto)
  @IsOptional()
  roles?: RoleImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryImportDto)
  @IsOptional()
  categories?: CategoryImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactReasonImportDto)
  @IsOptional()
  contactReasons?: ContactReasonImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentPurposeImportDto)
  @IsOptional()
  attachmentPurposes?: AttachmentPurposeImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasureTypeImportDto)
  @IsOptional()
  measureTypes?: MeasureTypeImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecisionOutcomeImportDto)
  @IsOptional()
  decisionOutcomes?: DecisionOutcomeImportDto[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatementOutcomeImportDto)
  @IsOptional()
  statementOutcomes?: StatementOutcomeImportDto[];
  /** The whole label tree (the gateway's `labelStructure`). */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabelImportDto)
  @IsOptional()
  labels?: LabelImportDto[];
  @ValidateNested()
  @Type(() => EmailIntegrationImportDto)
  @IsOptional()
  emailIntegration?: EmailIntegrationImportDto;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureFlagImportDto)
  @IsOptional()
  featureFlags?: FeatureFlagImportDto[];
}

/** An export is the same document; the alias exists for readability at call sites. */
export type NamespaceExportDto = NamespaceImportDto;
