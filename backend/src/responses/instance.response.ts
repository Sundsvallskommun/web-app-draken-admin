import ApiResponse from '@/interfaces/api-service.interface';
import { Instance as _Instance } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Instance implements Partial<_Instance> {
  @IsInt()
  id: number;
  @IsString()
  name: string;
  @IsString()
  url: string;
  @IsString()
  authorizedGroups: string;
  @IsBoolean()
  enabled: boolean;
  @IsNumber()
  municipalityId: number;
}

export class InstanceDeleteApiResponse implements ApiResponse<boolean> {
  @IsBoolean()
  data: boolean;
  @IsString()
  message: string;
}

export class InstancesApiResponse implements ApiResponse<Instance[]> {
  @ValidateNested({ each: true })
  @Type(() => Instance)
  data: Instance[];
  @IsString()
  message: string;
}

export class InstanceApiResponse implements ApiResponse<Instance> {
  @ValidateNested()
  @Type(() => Instance)
  data: Instance;
  @IsString()
  message: string;
}
