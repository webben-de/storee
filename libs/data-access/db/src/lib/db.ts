import Dexie, { type EntityTable } from 'dexie';

export interface Location {
  id: string;
  parent_id: string | null;
  name: string;
  description: string;
  icon: string;
  gps_lat: number | null;
  gps_lng: number | null;
  image_uri: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface StoreeObject {
  id: string;
  location_id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  image_uri: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  quantity: number;
  created_at: number;
  updated_at: number;
}

export interface ObjectHistory {
  id: string;
  object_id: string;
  from_location_id: string | null;
  to_location_id: string;
  moved_at: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface StoreeList {
  id: string;
  name: string;
  description: string;
  created_at: number;
  updated_at: number;
}

export interface StoreeListItem {
  id: string;
  list_id: string;
  object_id: string | null;
  custom_label: string | null;
  checked: boolean;
  sort_order: number;
  created_at: number;
}

class StoreeDB extends Dexie {
  locations!: EntityTable<Location, 'id'>;
  objects!: EntityTable<StoreeObject, 'id'>;
  objectHistory!: EntityTable<ObjectHistory, 'id'>;
  settings!: EntityTable<Setting, 'key'>;
  lists!: EntityTable<StoreeList, 'id'>;
  listItems!: EntityTable<StoreeListItem, 'id'>;

  constructor() {
    super('StoreeDB');
    this.version(1).stores({
      locations: 'id, parent_id, name, sort_order, created_at',
      objects: 'id, location_id, name, category, created_at',
      objectHistory: 'id, object_id, moved_at',
      settings: 'key',
    });
    this.version(2).stores({
      locations: 'id, parent_id, name, sort_order, created_at',
      objects: 'id, location_id, name, category, created_at',
      objectHistory: 'id, object_id, moved_at',
      settings: 'key',
      lists: 'id, name, created_at',
      listItems: 'id, list_id, object_id, checked',
    });
  }
}

export const db = new StoreeDB();
