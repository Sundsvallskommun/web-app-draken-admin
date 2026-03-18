import { Label as SupportManagementLabel } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Label {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  classification: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  resourceName: string;
  @IsString()
  @IsOptional()
  resourcePath?: string;
  @IsBoolean()
  @IsOptional()
  isLeaf?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Label)
  @IsOptional()
  labels?: Label[];
}

export class LabelsApiResponse implements ApiResponse<Label[]> {
  @ValidateNested({ each: true })
  @Type(() => Label)
  data: Label[];
  @IsString()
  message: string;
}
