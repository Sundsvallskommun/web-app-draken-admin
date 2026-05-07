import { Status as supportmanagementStatus} from '@/data-contracts/supportmanagement/data-contracts';
import { IsOptional, IsString } from 'class-validator';

export class StatusRequestDto implements supportmanagementStatus {
  @IsString()
  name: string;
  @IsString()
  namespace: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  externalDisplayName?: string;
}

export class StatusUpdateDto {
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  externalDisplayName?: string;
  @IsString()
  namespace: string;
}
