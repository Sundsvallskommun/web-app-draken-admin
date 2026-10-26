import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class MeasureTypeRequestDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  /** A measure type belongs to at least one group; the gateway requires them on create. */
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
  @IsString()
  namespace: string;
}

export class MeasureTypeUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  /** May be left out on update, but the gateway rejects an empty list. */
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsOptional()
  measureGroups?: string[];
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  @IsOptional()
  namespace?: string;
}
