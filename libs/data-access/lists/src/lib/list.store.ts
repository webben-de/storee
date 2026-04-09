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
  type StoreeList,
  type StoreeListItem,
} from '@storee/data-access-db';
import { v4 as uuid } from 'uuid';

interface ListState {
  lists: StoreeList[];
  listItems: StoreeListItem[];
  loading: boolean;
  error: string | null;
}

export const ListStore = signalStore(
  { providedIn: 'root' },
  withState<ListState>({
    lists: [],
    listItems: [],
    loading: false,
    error: null,
  }),
  withComputed(({ lists, listItems }) => ({
    getListById: computed(
      () => (id: string) => lists().find((l) => l.id === id) ?? null,
    ),
    getItemsByList: computed(
      () => (listId: string) =>
        listItems()
          .filter((i) => i.list_id === listId)
          .sort((a, b) => a.sort_order - b.sort_order),
    ),
  })),
  withMethods((store) => {
    return {
      loadAll: rxMethod<void>(
        switchMap(() =>
          from(
            liveQuery(async () => {
              const [lists, items] = await Promise.all([
                db.lists.orderBy('created_at').toArray(),
                db.listItems.toArray(),
              ]);
              return { lists, items };
            }),
          ).pipe(
            tapResponse({
              next: ({ lists, items }) =>
                patchState(store, { lists, listItems: items, loading: false }),
              error: (e: Error) =>
                patchState(store, { error: e.message, loading: false }),
            }),
          ),
        ),
      ),

      async createList(data: {
        name: string;
        description: string;
      }): Promise<string> {
        const now = Date.now();
        const id = uuid();
        const list: StoreeList = {
          ...data,
          id,
          created_at: now,
          updated_at: now,
        };
        await db.lists.add(list);
        return id;
      },

      async updateList(
        id: string,
        changes: Partial<Pick<StoreeList, 'name' | 'description'>>,
      ): Promise<void> {
        await db.lists.update(id, { ...changes, updated_at: Date.now() });
      },

      async deleteList(id: string): Promise<void> {
        await db.transaction('rw', db.lists, db.listItems, async () => {
          await db.listItems.where('list_id').equals(id).delete();
          await db.lists.delete(id);
        });
      },

      async addItem(
        listId: string,
        payload: { object_id: string | null; custom_label: string | null },
      ): Promise<string> {
        const existing = await db.listItems
          .where('list_id')
          .equals(listId)
          .toArray();
        const maxOrder = existing.reduce(
          (m, i) => Math.max(m, i.sort_order),
          -1,
        );
        const id = uuid();
        const item: StoreeListItem = {
          id,
          list_id: listId,
          object_id: payload.object_id,
          custom_label: payload.custom_label,
          checked: false,
          sort_order: maxOrder + 1,
          created_at: Date.now(),
        };
        await db.listItems.add(item);
        return id;
      },

      async toggleItem(itemId: string): Promise<void> {
        const item = await db.listItems.get(itemId);
        if (item) {
          await db.listItems.update(itemId, { checked: !item.checked });
        }
      },

      async removeItem(itemId: string): Promise<void> {
        await db.listItems.delete(itemId);
      },

      async uncheckAll(listId: string): Promise<void> {
        const items = await db.listItems
          .where('list_id')
          .equals(listId)
          .toArray();
        await db.transaction('rw', db.listItems, async () => {
          for (const item of items) {
            await db.listItems.update(item.id, { checked: false });
          }
        });
      },
    };
  }),
);
