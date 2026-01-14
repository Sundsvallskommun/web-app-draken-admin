import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DetailedTemplateResponseTypeEnum {
  PEBBLE = 'PEBBLE',
  WORD = 'WORD',
}

export class DetailedTemplateResponseDTO {
  @IsString()
  @IsOptional()
  identifier?: string;
  @IsString()
  @IsOptional()
  version?: string;
  @IsEnum(DetailedTemplateResponseTypeEnum)
  @IsOptional()
  type?: DetailedTemplateResponseTypeEnum;
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @IsOptional()
  metadata?: string;
  @IsString()
  @IsOptional()
  defaultValues?: string;
  @IsString()
  @IsOptional()
  changeLog?: string;
  @IsString()
  @IsOptional()
  lastModifiedAt?: string;
  @IsString()
  @IsOptional()
  content?: string;
}
