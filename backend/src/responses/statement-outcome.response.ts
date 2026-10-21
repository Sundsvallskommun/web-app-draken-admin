import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class StatementOutcome {
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
  responded: boolean;
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

export class StatementOutcomeDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class StatementOutcomesApiResponse implements ApiResponse<StatementOutcome[]> {
  @ValidateNested({ each: true })
  @Type(() => StatementOutcome)
  data: StatementOutcome[];
  @IsString()
  message: string;
}

export class StatementOutcomeApiResponse implements ApiResponse<StatementOutcome> {
  @ValidateNested()
  @Type(() => StatementOutcome)
  data: StatementOutcome;
  @IsString()
  message: string;
}
