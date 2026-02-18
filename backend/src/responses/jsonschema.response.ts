import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class JsonSchemaResponseDTO {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsObject()
  value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  created?: string;

  @IsNumber()
  @IsOptional()
  validationUsageCount?: number;

  @IsString()
  @IsOptional()
  lastUsedForValidation?: string;
}

export class UiSchemaResponseDTO {
  @IsString()
  id: string;

  @IsObject()
  value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  created?: string;
}
