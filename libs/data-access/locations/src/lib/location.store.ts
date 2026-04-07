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
import { db, type Location, SyncService } from '@storee/data-access-db';
import { v4 as uuid } from 'uuid';

export type LocationTree = Location & { children: LocationTree[] };

function buildTree(
  locations: Location[],
  parentId: string | null = null,
): LocationTree[] {
  return locations
    .filter((l) => l.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => ({ ...l, children: buildTree(locations, l.id) }));
}

interface LocationState {
  locations: Location[];
  loading: boolean;
  error: string | null;
}

export const LocationStore = signalStore(
  { providedIn: 'root' },
  withState<LocationState>({ locations: [], loading: false, error: null }),
  withComputed(({ locations }) => ({
    rootLocations: computed(() =>
      locations().filter((l) => l.parent_id === null),
    ),
    tree: computed(() => buildTree(locations())),
    getById: computed(
      () => (id: string) => locations().find((l) => l.id === id) ?? null,
    ),
    getChildren: computed(
      () => (parentId: string) =>
        locations().filter((l) => l.parent_id === parentId),
    ),
  })),
  withMethods((store) => {
    const syncSvc = inject(SyncService);

    return {
      loadAll: rxMethod<void>(
        switchMap(() =>
          // Pull from server first (errors ignored for offline support), then live-read Dexie
          from(syncSvc.syncAll().catch(() => {})).pipe(
            switchMap(() =>
              from(
                liveQuery(() => db.locations.orderBy('sort_order').toArray()),
              ).pipe(
                tapResponse({
                  next: (locs) =>
                    patchState(store, { locations: locs, loading: false }),
                  error: (e: Error) =>
                    patchState(store, { error: e.message, loading: false }),
                }),
              ),
            ),
          ),
        ),
      ),

      async create(
        data: Omit<Location, 'id' | 'created_at' | 'updated_at'>,
      ): Promise<string> {
        const now = Date.now();
        const id = uuid();
        const loc: Location = { ...data, id, created_at: now, updated_at: now };
        await db.locations.add(loc);
        syncSvc.createLocationRemote(loc).catch(console.error);
        return id;
      },

      async update(
        id: string,
        changes: Partial<Omit<Location, 'id' | 'created_at'>>,
      ): Promise<void> {
        const fullChanges = { ...changes, updated_at: Date.now() };
        await db.locations.update(id, fullChanges);
        syncSvc.updateLocationRemote(id, fullChanges).catch(console.error);
      },

      async remove(id: string): Promise<void> {
        await db.transaction('rw', db.locations, db.objects, async () => {
          await db.locations.delete(id);
        });
        syncSvc.deleteLocationRemote(id).catch(console.error);
      },
    };
  }),
);
