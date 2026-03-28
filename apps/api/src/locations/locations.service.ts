import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.location.findMany({
      where: { userId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const loc = await this.prisma.location.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!loc) throw new NotFoundException(`Location ${id} not found`);
    return loc;
  }

  create(userId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({
      data: {
        id: dto.id,
        userId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        description: dto.description ?? '',
        icon: dto.icon ?? '📁',
        gpsLat: dto.gpsLat ?? null,
        gpsLng: dto.gpsLng ?? null,
        imageUri: dto.imageUri ?? null,
        sortOrder: BigInt(dto.sortOrder),
        createdAt: BigInt(dto.createdAt),
        updatedAt: BigInt(dto.updatedAt),
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateLocationDto) {
    await this.findOne(userId, id);
    return this.prisma.location.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
        ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
        ...(dto.imageUri !== undefined && { imageUri: dto.imageUri }),
        ...(dto.sortOrder !== undefined && { sortOrder: BigInt(dto.sortOrder) }),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.location.update({
      where: { id },
      data: { deletedAt: BigInt(Date.now()) },
    });
  }
}
