import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsNumber, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { CreateLocationDto } from '../locations/location.dto';
import { CreateObjectDto } from '../objects/object.dto';

export class ObjectHistoryDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsString()
  objectId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  fromLocationId?: string | null;

  @ApiProperty()
  @IsString()
  toLocationId!: string;

  @ApiProperty()
  @IsNumber()
  movedAt!: number;
}

export class SyncRequestDto {
  @ApiProperty({ description: 'Client timestamp of last successful sync (0 = full sync)' })
  @IsNumber()
  lastSyncAt!: number;

  @ApiProperty({ type: [CreateLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLocationDto)
  locations!: CreateLocationDto[];

  @ApiProperty({ type: [CreateObjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateObjectDto)
  objects!: CreateObjectDto[];

  @ApiProperty({ type: [ObjectHistoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObjectHistoryDto)
  objectHistory!: ObjectHistoryDto[];

  @ApiProperty({ type: [String], description: 'IDs of records deleted on client' })
  @IsArray()
  @IsString({ each: true })
  deletedLocationIds!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  deletedObjectIds!: string[];
}
