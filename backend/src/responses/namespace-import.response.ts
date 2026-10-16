import { NamespaceImportDto } from '@/dtos/namespace-import.dto';
import ApiResponse from '@/interfaces/api-service.interface';
import { DELETE_SECTION_ORDER, DeleteSection } from '@/services/namespace-delete.service';
import { ImportSection, IssueSeverity, SECTION_ORDER } from '@/utils/namespace-import-validation';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export const IMPORT_OUTCOMES = ['valid', 'invalid', 'conflict', 'completed', 'partial_failure'] as const;
export type ImportOutcome = (typeof IMPORT_OUTCOMES)[number];

export const IMPORT_STEP_STATUSES = ['done', 'skipped', 'failed', 'not_run'] as const;
export type ImportStepStatus = (typeof IMPORT_STEP_STATUSES)[number];

export class ImportIssueResponse {
  @IsString()
  path: string;
  @IsString()
  message: string;
  @IsIn(['error', 'warning'])
  severity: IssueSeverity;
}

export class ImportPlanEntryResponse {
  @IsIn([...SECTION_ORDER])
  section: ImportSection;
  @IsInt()
  create: number;
  @IsInt()
  skip: number;
  @IsArray()
  @IsString({ each: true })
  skipped: string[];
}

export class ImportStepResult {
  @IsIn([...SECTION_ORDER])
  section: ImportSection;
  @IsIn([...IMPORT_STEP_STATUSES])
  status: ImportStepStatus;
  @IsArray()
  @IsString({ each: true })
  created: string[];
  @IsArray()
  @IsString({ each: true })
  skipped: string[];
  @IsString()
  @IsOptional()
  error?: string;
}

export class NamespaceImportReport {
  /**
   * valid/invalid/conflict come from validation (always on a dry run, or before anything
   * is written); completed/partial_failure describe an executed import.
   */
  @IsIn([...IMPORT_OUTCOMES])
  outcome: ImportOutcome;
  @IsBoolean()
  dryRun: boolean;
  @IsBoolean()
  allowExisting: boolean;
  @IsString()
  namespace: string;
  @ValidateNested({ each: true })
  @Type(() => ImportIssueResponse)
  issues: ImportIssueResponse[];
  @ValidateNested({ each: true })
  @Type(() => ImportPlanEntryResponse)
  plan: ImportPlanEntryResponse[];
  /** Empty on a dry run. */
  @ValidateNested({ each: true })
  @Type(() => ImportStepResult)
  steps: ImportStepResult[];
}

export class NamespaceImportApiResponse implements ApiResponse<NamespaceImportReport> {
  @ValidateNested()
  @Type(() => NamespaceImportReport)
  data: NamespaceImportReport;
  @IsString()
  message: string;
}

export class NamespaceExportApiResponse implements ApiResponse<NamespaceImportDto> {
  @ValidateNested()
  @Type(() => NamespaceImportDto)
  data: NamespaceImportDto;
  @IsString()
  message: string;
}

export const DELETE_OUTCOMES = ['disabled', 'ready', 'not_found', 'has_errands', 'completed', 'partial_failure'] as const;
export type DeleteOutcome = (typeof DELETE_OUTCOMES)[number];

export class DeletePlanEntryResponse {
  @IsIn([...DELETE_SECTION_ORDER])
  section: DeleteSection;
  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class DeleteStepResult {
  @IsIn([...DELETE_SECTION_ORDER])
  section: DeleteSection;
  @IsIn([...IMPORT_STEP_STATUSES])
  status: ImportStepStatus;
  @IsArray()
  @IsString({ each: true })
  deleted: string[];
  @IsString()
  @IsOptional()
  error?: string;
}

export class NamespaceDeleteReport {
  /**
   * disabled: the backend runs without NAMESPACE_DELETE_ENABLED=true. ready/not_found/has_errands come
   * from the inspection; completed/partial_failure describe an executed delete.
   */
  @IsIn([...DELETE_OUTCOMES])
  outcome: DeleteOutcome;
  @IsBoolean()
  dryRun: boolean;
  @IsString()
  namespace: string;
  /** Errands in the namespace. A delete is refused while this is above zero. */
  @IsInt()
  errandCount: number;
  @ValidateNested({ each: true })
  @Type(() => DeletePlanEntryResponse)
  plan: DeletePlanEntryResponse[];
  /** Empty on a dry run. */
  @ValidateNested({ each: true })
  @Type(() => DeleteStepResult)
  steps: DeleteStepResult[];
}

export class NamespaceDeleteApiResponse implements ApiResponse<NamespaceDeleteReport> {
  @ValidateNested()
  @Type(() => NamespaceDeleteReport)
  data: NamespaceDeleteReport;
  @IsString()
  message: string;
}
