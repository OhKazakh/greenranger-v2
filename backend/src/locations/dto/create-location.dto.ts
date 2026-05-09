import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

enum LocationCategory {
  hub = 'hub',
  kiosk = 'kiosk',
}

export class CreateLocationDto {
  @IsString() @MinLength(2) slug: string;
  @IsEnum(LocationCategory) category: LocationCategory;

  @IsString() nameRu: string;
  @IsString() nameEn: string;
  @IsString() nameKk: string;

  @IsString() descriptionRu: string;
  @IsString() descriptionEn: string;
  @IsString() descriptionKk: string;

  @IsString() addressRu: string;
  @IsString() addressEn: string;
  @IsString() addressKk: string;

  @IsNumber() lat: number;
  @IsNumber() lng: number;

  @IsArray() @IsString({ each: true }) materials: string[];

  @IsOptional() @IsString() scheduleWeekdays?: string;
  @IsOptional() @IsString() scheduleSaturday?: string;
  @IsOptional() @IsString() scheduleSunday?: string;

  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsOptional() @IsBoolean() verified?: boolean;
}
