import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { ObjectsService } from './objects.service';
import { CreateObjectDto, UpdateObjectDto } from './object.dto';

@ApiTags('objects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('objects')
export class ObjectsController {
  constructor(private objects: ObjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all objects for the current user' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.objects.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single object by ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.objects.findOne(user.id, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get movement history for an object' })
  getHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.objects.findHistory(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new object' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateObjectDto) {
    return this.objects.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an object' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateObjectDto,
  ) {
    return this.objects.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an object' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.objects.remove(user.id, id);
  }
}
