import { IsObject, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class JsonSchemaRequestDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @Matches(/^(\d+\.)?(\d+)$/, { message: 'Version must be in format [major].[minor], e.g. 1.0' })
  version: string;

  @IsObject()
  value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UiSchemaRequestDto {
  @IsObject()
  value: Record<string, unknown>;

  @IsString()
  @IsOptional()
  description?: string;
}
