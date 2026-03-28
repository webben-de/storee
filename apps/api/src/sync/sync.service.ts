import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncRequestDto } from './sync.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bidirectional sync — last-write-wins by updatedAt.
   *
   * 1. Apply client deletes (soft-delete)
   * 2. Upsert client locations & objects (if client updatedAt is newer)
   * 3. Upsert client objectHistory
   * 4. Return all server records updated since lastSyncAt
   */
  async sync(userId: string, dto: SyncRequestDto) {
    const now = BigInt(Date.now());
    const since = BigInt(dto.lastSyncAt);

    await this.prisma.$transaction(async (tx) => {
      // ── 1. Soft-delete locations ──────────────────────────────────────────
      if (dto.deletedLocationIds.length > 0) {
        await tx.location.updateMany({
          where: { id: { in: dto.deletedLocationIds }, userId, deletedAt: null },
          data: { deletedAt: now },
        });
      }

      // ── 2. Soft-delete objects ────────────────────────────────────────────
      if (dto.deletedObjectIds.length > 0) {
        await tx.storeeObject.updateMany({
          where: { id: { in: dto.deletedObjectIds }, userId, deletedAt: null },
          data: { deletedAt: now },
        });
      }

      // ── 3. Upsert locations ───────────────────────────────────────────────
      for (const loc of dto.locations) {
        const existing = await tx.location.findFirst({ where: { id: loc.id, userId } });
        if (!existing || existing.updatedAt < BigInt(loc.updatedAt)) {
          await tx.location.upsert({
            where: { id: loc.id },
            create: {
              id: loc.id,
              userId,
              parentId: loc.parentId ?? null,
              name: loc.name,
              description: loc.description ?? '',
              icon: loc.icon ?? '📁',
              gpsLat: loc.gpsLat ?? null,
              gpsLng: loc.gpsLng ?? null,
              imageUri: loc.imageUri ?? null,
              sortOrder: BigInt(loc.sortOrder),
              createdAt: BigInt(loc.createdAt),
              updatedAt: BigInt(loc.updatedAt),
            },
            update: {
              parentId: loc.parentId ?? null,
              name: loc.name,
              description: loc.description ?? '',
              icon: loc.icon ?? '📁',
              gpsLat: loc.gpsLat ?? null,
              gpsLng: loc.gpsLng ?? null,
              imageUri: loc.imageUri ?? null,
              sortOrder: BigInt(loc.sortOrder),
              updatedAt: BigInt(loc.updatedAt),
            },
          });
        }
      }

      // ── 4. Upsert objects ─────────────────────────────────────────────────
      for (const obj of dto.objects) {
        const existing = await tx.storeeObject.findFirst({ where: { id: obj.id, userId } });
        if (!existing || existing.updatedAt < BigInt(obj.updatedAt)) {
          await tx.storeeObject.upsert({
            where: { id: obj.id },
            create: {
              id: obj.id,
              userId,
              locationId: obj.locationId,
              name: obj.name,
              description: obj.description ?? '',
              category: obj.category ?? '',
              tags: obj.tags ?? [],
              imageUri: obj.imageUri ?? null,
              gpsLat: obj.gpsLat ?? null,
              gpsLng: obj.gpsLng ?? null,
              quantity: obj.quantity ?? 1,
              createdAt: BigInt(obj.createdAt),
              updatedAt: BigInt(obj.updatedAt),
            },
            update: {
              locationId: obj.locationId,
              name: obj.name,
              description: obj.description ?? '',
              category: obj.category ?? '',
              tags: obj.tags ?? [],
              imageUri: obj.imageUri ?? null,
              gpsLat: obj.gpsLat ?? null,
              gpsLng: obj.gpsLng ?? null,
              quantity: obj.quantity ?? 1,
              updatedAt: BigInt(obj.updatedAt),
            },
          });
        }
      }

      // ── 5. Upsert objectHistory ───────────────────────────────────────────
      for (const h of dto.objectHistory) {
        await tx.objectHistory.upsert({
          where: { id: h.id },
          create: {
            id: h.id,
            userId,
            objectId: h.objectId,
            fromLocationId: h.fromLocationId ?? null,
            toLocationId: h.toLocationId,
            movedAt: BigInt(h.movedAt),
          },
          update: {},
        });
      }
    });

    // ── Return server delta since lastSyncAt ──────────────────────────────
    const [locations, objects, objectHistory] = await Promise.all([
      this.prisma.location.findMany({
        where: { userId, updatedAt: { gte: since } },
      }),
      this.prisma.storeeObject.findMany({
        where: { userId, updatedAt: { gte: since } },
      }),
      this.prisma.objectHistory.findMany({
        where: { userId, movedAt: { gte: since } },
      }),
    ]);

    return {
      syncedAt: Number(now),
      locations: locations.map(this.serializeBigInt),
      objects: objects.map(this.serializeBigInt),
      objectHistory: objectHistory.map(this.serializeBigInt),
    };
  }

  // Prisma returns BigInt for timestamp fields — convert to number for JSON
  private serializeBigInt<T extends object>(record: T): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v]),
    );
  }
}
