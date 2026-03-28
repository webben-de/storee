import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsPositive, IsNotEmpty,
} from 'class-validator';

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  gpsLat?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  gpsLng?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  imageUri?: string | null;

  @ApiProperty()
  @IsNumber()
  sortOrder!: number;

  @ApiProperty()
  @IsNumber()
  createdAt!: number;

  @ApiProperty()
  @IsNumber()
  updatedAt!: number;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}
