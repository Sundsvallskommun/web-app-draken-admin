import { Status as supportmanagementStatus } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Status implements supportmanagementStatus {
  @IsString()
  id: string;
  @IsString()
  name: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class StatusDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class StatusesApiResponse implements ApiResponse<Status[]> {
  @ValidateNested({ each: true })
  @Type(() => Status)
  data: Status[];
  @IsString()
  message: string;
}
export class StatusApiResponse implements ApiResponse<Status> {
  @ValidateNested()
  @Type(() => Status)
  data: Status;
  @IsString()
  message: string;
}
