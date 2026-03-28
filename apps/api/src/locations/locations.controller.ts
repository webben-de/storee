import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './location.dto';

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private locations: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all locations for the current user' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.locations.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single location by ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locations.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLocationDto) {
    return this.locations.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locations.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a location' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locations.remove(user.id, id);
  }
}
