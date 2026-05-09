import { IsString, IsArray, IsNumber, IsOptional, MinLength } from 'class-validator';

export class SuggestLocationDto {
  @IsString() @MinLength(3) name: string;
  @IsString() @MinLength(5) address: string;
  @IsString() @MinLength(10) description: string;
  @IsArray() @IsString({ each: true }) materials: string[];
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
}
