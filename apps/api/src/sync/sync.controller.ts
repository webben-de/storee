import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { SyncService } from './sync.service';
import { SyncRequestDto } from './sync.dto';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Post()
  @ApiOperation({
    summary: 'Bidirectional sync',
    description:
      'Push local changes and receive server delta since lastSyncAt. ' +
      'Last-write-wins conflict resolution based on updatedAt timestamp.',
  })
  sync(@CurrentUser() user: AuthUser, @Body() dto: SyncRequestDto) {
    return this.syncService.sync(user.id, dto);
  }
}
