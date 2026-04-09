import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjectDto, UpdateObjectDto } from './object.dto';

@Injectable()
export class ObjectsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.storeeObject.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const obj = await this.prisma.storeeObject.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!obj) throw new NotFoundException(`Object ${id} not found`);
    return obj;
  }

  findHistory(userId: string, objectId: string) {
    return this.prisma.objectHistory.findMany({
      where: { userId, objectId },
      orderBy: { movedAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateObjectDto) {
    return this.prisma.storeeObject.create({
      data: {
        id: dto.id,
        userId,
        locationId: dto.locationId,
        name: dto.name,
        description: dto.description ?? '',
        category: dto.category ?? '',
        tags: dto.tags ?? [],
        imageUri: dto.imageUri ?? null,
        gpsLat: dto.gpsLat ?? null,
        gpsLng: dto.gpsLng ?? null,
        quantity: dto.quantity ?? 1,
        createdAt: BigInt(Math.round(dto.createdAt)),
        updatedAt: BigInt(Math.round(dto.updatedAt)),
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateObjectDto) {
    await this.findOne(userId, id);
    return this.prisma.storeeObject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.locationId !== undefined && { locationId: dto.locationId }),
        ...(dto.imageUri !== undefined && { imageUri: dto.imageUri }),
        ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
        ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.storeeObject.update({
      where: { id },
      data: { deletedAt: BigInt(Date.now()) },
    });
  }
}
