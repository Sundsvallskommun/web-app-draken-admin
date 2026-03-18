import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { Instance as _Instance } from '@prisma/client';

export class InstanceRequestDto implements Partial<_Instance> {
  @IsString()
  name: string;
  @IsString()
  url: string;
  @IsString()
  authorizedGroups: string;
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateInstanceDto implements Partial<_Instance> {
  @IsInt()
  id: number;
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  url?: string;
  @IsString()
  @IsOptional()
  authorizedGroups?: string;
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
