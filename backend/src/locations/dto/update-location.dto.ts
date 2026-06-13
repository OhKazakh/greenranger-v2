import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

enum LocationCategory {
  hub = 'hub',
  kiosk = 'kiosk',
}

export class UpdateLocationDto {
  @IsOptional() @IsEnum(LocationCategory) category?: LocationCategory;

  @IsOptional() @IsString() nameRu?: string;
  @IsOptional() @IsString() nameEn?: string;
  @IsOptional() @IsString() nameKk?: string;

  @IsOptional() @IsString() descriptionRu?: string;
  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() descriptionKk?: string;

  @IsOptional() @IsString() addressRu?: string;
  @IsOptional() @IsString() addressEn?: string;
  @IsOptional() @IsString() addressKk?: string;

  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;

  @IsOptional() @IsArray() @IsString({ each: true }) materials?: string[];

  @IsOptional() @IsString() scheduleWeekdays?: string;
  @IsOptional() @IsString() scheduleSaturday?: string;
  @IsOptional() @IsString() scheduleSunday?: string;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsOptional() @IsBoolean() verified?: boolean;
}
