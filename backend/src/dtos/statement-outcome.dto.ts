import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class StatementOutcomeRequestDto {
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsInt()
  @IsOptional()
  sortOrder?: number;
  /** Whether the outcome means the counterparty responded. The gateway defaults it to true. */
  @IsBoolean()
  @IsOptional()
  responded?: boolean;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  namespace: string;
}

export class StatementOutcomeUpdateDto {
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
  @IsString()
  @IsOptional()
  namespace?: string;
}
