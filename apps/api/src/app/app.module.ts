import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { ObjectsModule } from '../objects/objects.module';
import { SyncModule } from '../sync/sync.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LocationsModule,
    ObjectsModule,
    SyncModule,
    UploadModule,
  ],
})
export class AppModule {}
