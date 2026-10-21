import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class DecisionOutcomeRequestDto {
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
  @IsString()
  namespace: string;
}

export class DecisionOutcomeUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
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
