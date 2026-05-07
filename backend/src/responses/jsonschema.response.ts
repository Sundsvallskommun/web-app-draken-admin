import { JsonNode } from '@/data-contracts/jsonschema/data-contracts';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class JsonSchemaResponseDTO {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsObject()
  @IsOptional()
  value?: JsonNode;

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
  @IsOptional()
  id?: string;

  @IsObject()
  @IsOptional()
  value?: JsonNode;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  created?: string;
}
