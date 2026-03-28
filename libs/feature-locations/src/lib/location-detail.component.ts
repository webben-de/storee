import { Component, inject, input, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';
import { db, type Location, type StoreeObject } from '@storee/data-access-db';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'lib-location-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, IconComponent],
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .sheet-enter { animation: slideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }
  `],
  template: `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-6">

      @if (location(); as loc) {

        <!-- Header -->
        <header class="flex items-center gap-2 mb-8">
          <button (click)="back()" class="btn-icon" [attr.aria-label]="'common.back' | transloco">
            <app-icon name="arrow-left" [size]="20" aria-hidden="true" />
          </button>
          <span class="flex items-center justify-center w-10 h-10 rounded-xl
                       bg-brand-50 dark:bg-brand-950/50 shrink-0">
            <app-icon name="folder" [size]="20" class="text-brand-600 dark:text-brand-400" aria-hidden="true" />
          </span>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 truncate leading-snug">
              {{ loc.name }}
            </h1>
            @if (loc.description) {
              <p class="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ loc.description }}</p>
            }
          </div>

          <!-- Move button -->
          <button
            (click)="openMover()"
            class="btn-icon"
            title="Move to another location"
            aria-label="Move to another location"
          >
            <app-icon name="move" [size]="18" aria-hidden="true" />
          </button>

          <a [routerLink]="['/location', id(), 'edit']" class="btn-icon" [attr.aria-label]="'common.edit' | transloco">
            <app-icon name="pencil" [size]="18" aria-hidden="true" />
          </a>
        </header>

        <!-- Sub-locations -->
        <section class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-label">{{ 'location.sub_locations' | transloco }}</h2>
            <a [routerLink]="['/location', 'new']" [queryParams]="{ parent: id() }"
               class="btn-ghost h-8 px-3 text-xs">
              <app-icon name="plus" [size]="14" aria-hidden="true" />
              {{ 'location.add_sub_location' | transloco }}
            </a>
          </div>

          @if (children().length === 0) {
            <div class="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                        border border-dashed border-zinc-200 dark:border-zinc-800
                        text-zinc-400 dark:text-zinc-600 text-sm">
              <app-icon name="folder" [size]="16" aria-hidden="true" />
              No sub-locations yet
            </div>
          } @else {
            <ul class="space-y-2" role="list">
              @for (child of children(); track child.id; let i = $index) {
                <li class="stagger-item" [style.--index]="i">
                  <a [routerLink]="['/location', child.id]" class="card-row">
                    <span class="flex items-center justify-center w-9 h-9 rounded-xl
                                 bg-brand-50 dark:bg-brand-950/50 shrink-0">
                      <app-icon name="folder" [size]="16" class="text-brand-600 dark:text-brand-400" aria-hidden="true" />
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] font-[550] text-zinc-900 dark:text-zinc-100 truncate">{{ child.name }}</p>
                      @if (childCount(child.id); as count) {
                        <p class="text-xs text-zinc-400 mt-0.5">{{ count }}</p>
                      }
                    </div>
                    <app-icon name="chevron-right" [size]="16" class="text-zinc-400 shrink-0" aria-hidden="true" />
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <!-- Objects -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-label">{{ 'location.objects' | transloco }}</h2>
            <a [routerLink]="['/object', 'new']" [queryParams]="{ location: id() }"
               class="btn-ghost h-8 px-3 text-xs">
              <app-icon name="plus" [size]="14" aria-hidden="true" />
              {{ 'location.add_object' | transloco }}
            </a>
          </div>

          @if (objects().length === 0) {
            <div class="flex items-center gap-3 px-4 py-3.5 rounded-2xl
                        border border-dashed border-zinc-200 dark:border-zinc-800
                        text-zinc-400 dark:text-zinc-600 text-sm">
              <app-icon name="package" [size]="16" aria-hidden="true" />
              {{ 'location.empty_objects' | transloco }}
            </div>
          } @else {
            <ul class="space-y-2" role="list">
              @for (obj of objects(); track obj.id; let i = $index) {
                <li class="stagger-item flex items-center gap-2" [style.--index]="i">
                  <a [routerLink]="['/object', obj.id]" class="card-row flex-1">
                    @if (obj.image_uri) {
                      <img [src]="obj.image_uri" [alt]="obj.name"
                           class="w-10 h-10 rounded-xl object-cover shrink-0" width="40" height="40" />
                    } @else {
                      <span class="flex items-center justify-center w-9 h-9 rounded-xl
                                   bg-zinc-100 dark:bg-zinc-800 shrink-0">
                        <app-icon name="package" [size]="16" class="text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                      </span>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="text-[15px] font-[550] text-zinc-900 dark:text-zinc-100 truncate">{{ obj.name }}</p>
                      <p class="text-xs text-zinc-400 mt-0.5 tabular-nums">× {{ obj.quantity }}</p>
                    </div>
                    <app-icon name="chevron-right" [size]="16" class="text-zinc-400 shrink-0" aria-hidden="true" />
                  </a>

                  <button
                    (click)="convertToLocation(obj)"
                    class="btn-icon shrink-0"
                    title="Convert to location"
                    aria-label="Convert object to location"
                  >
                    <app-icon name="folder-open" [size]="18" aria-hidden="true" />
                  </button>
                </li>
              }
            </ul>
          }
        </section>

      } @else {
        <!-- Skeleton loading state -->
        <div class="space-y-4 animate-pulse py-6">
          <div class="skeleton h-8 w-40 mb-8"></div>
          @for (i of [0,1,2]; track i) {
            <div class="skeleton h-[60px] rounded-2xl"></div>
          }
        </div>
      }
    </div>

    <!-- ── Move location sheet ──────────────────────────────────────────── -->
    @if (showMover()) {
      <div
        class="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Move location"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          (click)="closeMover()"
        ></div>

        <!-- Sheet -->
        <div class="sheet-enter relative w-full max-w-lg mx-auto
                    bg-white dark:bg-zinc-900
                    rounded-t-3xl border-t border-x border-zinc-200/80 dark:border-zinc-800
                    shadow-2xl max-h-[80dvh] flex flex-col">

          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>

          <!-- Sheet header -->
          <div class="px-5 pt-3 pb-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">Move location</h2>
                <p class="text-xs text-zinc-500 mt-0.5">
                  Moving <strong class="font-medium text-zinc-700 dark:text-zinc-300">{{ location()?.name }}</strong>
                </p>
              </div>
              <button (click)="closeMover()" class="btn-icon" aria-label="Close">
                <app-icon name="x" [size]="18" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Target list -->
          <div class="overflow-y-auto flex-1 px-3 py-3">
            <ul class="space-y-1" role="listbox" aria-label="Select target location">

              <!-- Root option -->
              <li>
                <button
                  (click)="moveTo(null)"
                  [disabled]="location()?.parent_id === null"
                  class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                         hover:bg-zinc-50 dark:hover:bg-zinc-800
                         active:scale-[0.99] transition-all duration-150
                         disabled:opacity-40 disabled:cursor-default"
                  role="option"
                >
                  <span class="flex items-center justify-center w-9 h-9 rounded-xl
                               bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    <app-icon name="house" [size]="16" class="text-zinc-500" aria-hidden="true" />
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Root (no parent)</p>
                    <p class="text-xs text-zinc-400">Top-level location</p>
                  </div>
                  @if (location()?.parent_id === null) {
                    <span class="section-label">current</span>
                  }
                </button>
              </li>

              @if (moveTargets().length > 0) {
                <li class="px-3 py-1">
                  <div class="border-t border-zinc-100 dark:border-zinc-800"></div>
                </li>
              }

              @for (target of moveTargets(); track target.id) {
                <li>
                  <button
                    (click)="moveTo(target.id)"
                    [disabled]="target.id === location()?.parent_id"
                    class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left
                           hover:bg-brand-50 dark:hover:bg-brand-950/40
                           active:scale-[0.99] transition-all duration-150
                           disabled:opacity-40 disabled:cursor-default"
                    role="option"
                  >
                    <span class="flex items-center justify-center w-9 h-9 rounded-xl
                                 bg-brand-50 dark:bg-brand-950/50 shrink-0">
                      <app-icon name="folder" [size]="16" class="text-brand-600 dark:text-brand-400" aria-hidden="true" />
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-[550] text-zinc-900 dark:text-zinc-100 truncate">{{ target.name }}</p>
                      @if (target.description) {
                        <p class="text-xs text-zinc-400 truncate mt-0.5">{{ target.description }}</p>
                      }
                    </div>
                    @if (target.id === location()?.parent_id) {
                      <span class="section-label">current</span>
                    }
                  </button>
                </li>
              }

              @if (moveTargets().length === 0 && location()?.parent_id !== null) {
                <li class="px-3 py-6 text-center text-sm text-zinc-400">
                  No other locations available
                </li>
              }
            </ul>
          </div>
        </div>
      </div>
    }
  `,
})
export class LocationDetailComponent {
  id = input.required<string>();
  readonly locationStore = inject(LocationStore);
  private readonly objectStore = inject(ObjectStore);
  private router = inject(Router);

  location  = signal<Location | null>(null);
  children  = signal<Location[]>([]);
  objects   = signal<StoreeObject[]>([]);
  showMover = signal(false);

  /** All locations that are valid move targets: excludes self + all descendants */
  moveTargets = computed(() => {
    const currentId = this.id();
    const all = this.locationStore.locations();
    const descendants = this.getDescendantIds(currentId, all);
    return all.filter((l) => l.id !== currentId && !descendants.has(l.id));
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.location.set(this.locationStore.getById()(id));
      this.children.set(this.locationStore.getChildren()(id));
      this.objects.set(this.objectStore.getByLocation()(id));
    });
  }

  // ─── Move ────────────────────────────────────────────────────────────────

  openMover()  { this.showMover.set(true);  }
  closeMover() { this.showMover.set(false); }

  async moveTo(newParentId: string | null) {
    this.closeMover();
    await this.locationStore.update(this.id(), { parent_id: newParentId });
  }

  /** BFS to collect all descendant IDs — prevents circular moves */
  private getDescendantIds(id: string, all: Location[]): Set<string> {
    const set   = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const l of all) {
        if (l.parent_id === cur && !set.has(l.id)) {
          set.add(l.id);
          queue.push(l.id);
        }
      }
    }
    return set;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  childCount(locationId: string): string {
    const locs = this.locationStore.getChildren()(locationId).length;
    const objs = this.objectStore.getByLocation()(locationId).length;
    const parts: string[] = [];
    if (locs > 0) parts.push(`${locs} ${locs === 1 ? 'folder' : 'folders'}`);
    if (objs > 0) parts.push(`${objs} ${objs === 1 ? 'item' : 'items'}`);
    return parts.join(' · ');
  }

  async convertToLocation(obj: StoreeObject) {
    if (!confirm(`Convert "${obj.name}" to a location? The object will be deleted.`)) return;
    const now = Date.now();
    const newLocId = uuid();
    await db.transaction('rw', db.locations, db.objects, db.objectHistory, async () => {
      await db.locations.add({
        id: newLocId,
        parent_id: obj.location_id,
        name: obj.name,
        description: obj.description,
        icon: '📁',
        gps_lat: obj.gps_lat,
        gps_lng: obj.gps_lng,
        image_uri: obj.image_uri,
        sort_order: now,
        created_at: now,
        updated_at: now,
      });
      await db.objectHistory.where('object_id').equals(obj.id).delete();
      await db.objects.delete(obj.id);
    });
    this.router.navigate(['/location', newLocId]);
  }

  back() { history.back(); }
}
