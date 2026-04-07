import { inject } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { switchMap } from 'rxjs/operators';
import {
  db,
  type StoreeObject,
  type ObjectHistory,
  SyncService,
} from '@storee/data-access-db';
import { v4 as uuid } from 'uuid';

interface ObjectState {
  objects: StoreeObject[];
  loading: boolean;
  error: string | null;
}

export const ObjectStore = signalStore(
  { providedIn: 'root' },
  withState<ObjectState>({ objects: [], loading: false, error: null }),
  withComputed(({ objects }) => ({
    getById: computed(
      () => (id: string) => objects().find((o) => o.id === id) ?? null,
    ),
    getByLocation: computed(
      () => (locationId: string) =>
        objects().filter((o) => o.location_id === locationId),
    ),
  })),
  withMethods((store) => {
    const syncSvc = inject(SyncService);

    return {
      loadAll: rxMethod<void>(
        switchMap(() =>
          // syncAll is shared with LocationStore — runs once, second call is a no-op delta fetch
          from(syncSvc.syncAll().catch(() => {})).pipe(
            switchMap(() =>
              from(
                liveQuery(() => db.objects.orderBy('created_at').toArray()),
              ).pipe(
                tapResponse({
                  next: (objs) =>
                    patchState(store, { objects: objs, loading: false }),
                  error: (e: Error) =>
                    patchState(store, { error: e.message, loading: false }),
                }),
              ),
            ),
          ),
        ),
      ),

      async create(
        data: Omit<StoreeObject, 'id' | 'created_at' | 'updated_at'>,
      ): Promise<string> {
        const now = Date.now();
        const id = uuid();
        const obj: StoreeObject = {
          ...data,
          id,
          created_at: now,
          updated_at: now,
        };
        await db.transaction('rw', db.objects, db.objectHistory, async () => {
          await db.objects.add(obj);
          await db.objectHistory.add({
            id: uuid(),
            object_id: id,
            from_location_id: null,
            to_location_id: data.location_id,
            moved_at: now,
          });
        });
        syncSvc.createObjectRemote(obj).catch(console.error);
        return id;
      },

      async update(
        id: string,
        changes: Partial<Omit<StoreeObject, 'id' | 'created_at'>>,
      ): Promise<void> {
        const fullChanges = { ...changes, updated_at: Date.now() };
        await db.objects.update(id, fullChanges);
        syncSvc.updateObjectRemote(id, fullChanges).catch(console.error);
      },

      async move(objectId: string, toLocationId: string): Promise<void> {
        const obj = await db.objects.get(objectId);
        if (!obj) return;
        const now = Date.now();
        await db.transaction('rw', db.objects, db.objectHistory, async () => {
          await db.objects.update(objectId, {
            location_id: toLocationId,
            updated_at: now,
          });
          await db.objectHistory.add({
            id: uuid(),
            object_id: objectId,
            from_location_id: obj.location_id,
            to_location_id: toLocationId,
            moved_at: now,
          });
        });
        syncSvc
          .updateObjectRemote(objectId, {
            location_id: toLocationId,
            updated_at: now,
          })
          .catch(console.error);
      },

      async remove(id: string): Promise<void> {
        await db.transaction('rw', db.objects, db.objectHistory, async () => {
          await db.objectHistory.where('object_id').equals(id).delete();
          await db.objects.delete(id);
        });
        syncSvc.deleteObjectRemote(id).catch(console.error);
      },

      async getHistory(objectId: string): Promise<ObjectHistory[]> {
        return db.objectHistory
          .where('object_id')
          .equals(objectId)
          .sortBy('moved_at');
      },
    };
  }),
);
