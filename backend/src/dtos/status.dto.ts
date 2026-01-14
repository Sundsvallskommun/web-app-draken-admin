import { Status as supportmanagementStatus} from '@/data-contracts/supportmanagement/data-contracts';
import { IsString } from 'class-validator';

export class StatusRequestDto implements supportmanagementStatus {
  @IsString()
  name: string;
  @IsString()
  namespace: string;
}
