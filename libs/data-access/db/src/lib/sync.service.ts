import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { db, type Location, type StoreeObject, type ObjectHistory } from './db';

// --- API response shapes (Prisma camelCase, BigInt serialized to Number) ---

interface ApiLocation {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  description: string;
  icon: string;
  gpsLat: number | null;
  gpsLng: number | null;
  imageUri: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

interface ApiObject {
  id: string;
  userId: string;
  locationId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  imageUri: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  quantity: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

interface ApiObjectHistory {
  id: string;
  userId: string;
  objectId: string;
  fromLocationId: string | null;
  toLocationId: string;
  movedAt: number;
}

interface SyncResponse {
  syncedAt: number;
  locations: ApiLocation[];
  objects: ApiObject[];
  objectHistory: ApiObjectHistory[];
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private http = inject(HttpClient);

  /**
   * Pull all server changes since lastSyncAt and merge into the local Dexie DB.
   * On first call (no lastSyncAt recorded), pushes existing local data too so
   * pre-existing Dexie records are migrated to the server.
   */
  async syncAll(): Promise<void> {
    const lastSyncAtSetting = await db.settings.get('last_sync_at');
    const lastSyncAt = lastSyncAtSetting ? Number(lastSyncAtSetting.value) : 0;

    // On first sync, push all local data to the server
    const isFirstSync = lastSyncAt === 0;
    const [localLocs, localObjs, localHist] = isFirstSync
      ? await Promise.all([
          db.locations.toArray(),
          db.objects.toArray(),
          db.objectHistory.toArray(),
        ])
      : [[], [], []];

    const response = await firstValueFrom(
      this.http.post<SyncResponse>('/api/sync', {
        lastSyncAt,
        locations: localLocs.map((l) => this.localLocToDto(l)),
        objects: localObjs.map((o) => this.localObjToDto(o)),
        objectHistory: localHist.map((h) => this.localHistToDto(h)),
        deletedLocationIds: [],
        deletedObjectIds: [],
      }),
    );

    await db.transaction(
      'rw',
      db.locations,
      db.objects,
      db.objectHistory,
      async () => {
        for (const loc of response.locations) {
          if (loc.deletedAt) {
            await db.locations.delete(loc.id);
          } else {
            await db.locations.put(this.apiLocToLocal(loc));
          }
        }
        for (const obj of response.objects) {
          if (obj.deletedAt) {
            await db.objects.delete(obj.id);
          } else {
            await db.objects.put(this.apiObjToLocal(obj));
          }
        }
        for (const h of response.objectHistory) {
          await db.objectHistory.put(this.apiHistToLocal(h));
        }
      },
    );

    await db.settings.put({
      key: 'last_sync_at',
      value: String(response.syncedAt),
    });
  }

  // ── Location REST ──────────────────────────────────────────────────────────

  createLocationRemote(loc: Location): Promise<void> {
    return firstValueFrom(
      this.http.post(`/api/locations`, this.localLocToDto(loc)),
    ).then(() => undefined);
  }

  updateLocationRemote(id: string, changes: Partial<Location>): Promise<void> {
    return firstValueFrom(
      this.http.patch(`/api/locations/${id}`, this.partialLocToDto(changes)),
    ).then(() => undefined);
  }

  deleteLocationRemote(id: string): Promise<void> {
    return firstValueFrom(this.http.delete(`/api/locations/${id}`)).then(
      () => undefined,
    );
  }

  // ── Object REST ────────────────────────────────────────────────────────────

  createObjectRemote(obj: StoreeObject): Promise<void> {
    return firstValueFrom(
      this.http.post(`/api/objects`, this.localObjToDto(obj)),
    ).then(() => undefined);
  }

  updateObjectRemote(
    id: string,
    changes: Partial<StoreeObject>,
  ): Promise<void> {
    return firstValueFrom(
      this.http.patch(`/api/objects/${id}`, this.partialObjToDto(changes)),
    ).then(() => undefined);
  }

  deleteObjectRemote(id: string): Promise<void> {
    return firstValueFrom(this.http.delete(`/api/objects/${id}`)).then(
      () => undefined,
    );
  }

  // ── API (camelCase) → Dexie (snake_case) ──────────────────────────────────

  private apiLocToLocal(loc: ApiLocation): Location {
    return {
      id: loc.id,
      parent_id: loc.parentId,
      name: loc.name,
      description: loc.description,
      icon: loc.icon,
      gps_lat: loc.gpsLat,
      gps_lng: loc.gpsLng,
      image_uri: loc.imageUri,
      sort_order: loc.sortOrder,
      created_at: loc.createdAt,
      updated_at: loc.updatedAt,
    };
  }

  private apiObjToLocal(obj: ApiObject): StoreeObject {
    return {
      id: obj.id,
      location_id: obj.locationId,
      name: obj.name,
      description: obj.description,
      category: obj.category,
      tags: obj.tags,
      image_uri: obj.imageUri,
      gps_lat: obj.gpsLat,
      gps_lng: obj.gpsLng,
      quantity: obj.quantity,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
    };
  }

  private apiHistToLocal(h: ApiObjectHistory): ObjectHistory {
    return {
      id: h.id,
      object_id: h.objectId,
      from_location_id: h.fromLocationId,
      to_location_id: h.toLocationId,
      moved_at: h.movedAt,
    };
  }

  // ── Dexie (snake_case) → API DTO (camelCase) ──────────────────────────────

  private localLocToDto(loc: Location) {
    return {
      id: loc.id,
      parentId: loc.parent_id,
      name: loc.name,
      description: loc.description,
      icon: loc.icon,
      gpsLat: loc.gps_lat,
      gpsLng: loc.gps_lng,
      imageUri: loc.image_uri,
      sortOrder: loc.sort_order,
      createdAt: loc.created_at,
      updatedAt: loc.updated_at,
    };
  }

  private partialLocToDto(changes: Partial<Location>): Record<string, unknown> {
    const dto: Record<string, unknown> = {};
    if (changes.parent_id !== undefined) dto['parentId'] = changes.parent_id;
    if (changes.name !== undefined) dto['name'] = changes.name;
    if (changes.description !== undefined)
      dto['description'] = changes.description;
    if (changes.icon !== undefined) dto['icon'] = changes.icon;
    if (changes.gps_lat !== undefined) dto['gpsLat'] = changes.gps_lat;
    if (changes.gps_lng !== undefined) dto['gpsLng'] = changes.gps_lng;
    if (changes.image_uri !== undefined) dto['imageUri'] = changes.image_uri;
    if (changes.sort_order !== undefined) dto['sortOrder'] = changes.sort_order;
    if (changes.updated_at !== undefined) dto['updatedAt'] = changes.updated_at;
    return dto;
  }

  private localObjToDto(obj: StoreeObject) {
    return {
      id: obj.id,
      locationId: obj.location_id,
      name: obj.name,
      description: obj.description,
      category: obj.category,
      tags: obj.tags,
      imageUri: obj.image_uri,
      gpsLat: obj.gps_lat,
      gpsLng: obj.gps_lng,
      quantity: obj.quantity,
      createdAt: obj.created_at,
      updatedAt: obj.updated_at,
    };
  }

  private partialObjToDto(
    changes: Partial<StoreeObject>,
  ): Record<string, unknown> {
    const dto: Record<string, unknown> = {};
    if (changes.location_id !== undefined)
      dto['locationId'] = changes.location_id;
    if (changes.name !== undefined) dto['name'] = changes.name;
    if (changes.description !== undefined)
      dto['description'] = changes.description;
    if (changes.category !== undefined) dto['category'] = changes.category;
    if (changes.tags !== undefined) dto['tags'] = changes.tags;
    if (changes.image_uri !== undefined) dto['imageUri'] = changes.image_uri;
    if (changes.gps_lat !== undefined) dto['gpsLat'] = changes.gps_lat;
    if (changes.gps_lng !== undefined) dto['gpsLng'] = changes.gps_lng;
    if (changes.quantity !== undefined) dto['quantity'] = changes.quantity;
    if (changes.updated_at !== undefined) dto['updatedAt'] = changes.updated_at;
    return dto;
  }

  private localHistToDto(h: ObjectHistory) {
    return {
      id: h.id,
      objectId: h.object_id,
      fromLocationId: h.from_location_id,
      toLocationId: h.to_location_id,
      movedAt: h.moved_at,
    };
  }
}
