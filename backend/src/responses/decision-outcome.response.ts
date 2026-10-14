import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DecisionOutcome {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
  @IsBoolean()
  @IsOptional()
  deprecated?: boolean;
  @IsString()
  @IsOptional()
  namespace?: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class DecisionOutcomeDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class DecisionOutcomesApiResponse implements ApiResponse<DecisionOutcome[]> {
  @ValidateNested({ each: true })
  @Type(() => DecisionOutcome)
  data: DecisionOutcome[];
  @IsString()
  message: string;
}

export class DecisionOutcomeApiResponse implements ApiResponse<DecisionOutcome> {
  @ValidateNested()
  @Type(() => DecisionOutcome)
  data: DecisionOutcome;
  @IsString()
  message: string;
}
