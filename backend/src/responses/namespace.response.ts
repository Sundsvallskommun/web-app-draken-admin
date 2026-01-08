import { NamespaceConfig } from '@/data-contracts/supportmanagement/data-contracts';
import ApiResponse from '@/interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

export class Namespace implements Partial<NamespaceConfig> {
  @IsString()
  namespace: string;
  @IsString()
  displayName: string;
  @IsString()
  @IsOptional()
  shortCode?: string;
  @IsString()
  @IsOptional()
  createdAt?: string;
  @IsString()
  @IsOptional()
  updatedAt?: string;
}

export class NamespaceApiResponse implements ApiResponse<Namespace> {
  @ValidateNested({ each: true })
  @Type(() => Namespace)
  data: Namespace;
  @IsString()
  message: string;
}

export class NamespacesApiResponse implements ApiResponse<Namespace[]> {
  @ValidateNested({ each: true })
  @Type(() => Namespace)
  data: Namespace[];
  @IsString()
  message: string;
}
