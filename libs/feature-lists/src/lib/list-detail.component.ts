import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ListStore } from '@storee/data-access-lists';
import { ObjectStore } from '@storee/data-access-objects';

@Component({
  selector: 'lib-list-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslocoModule,
    IconComponent,
  ],
  template: `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-6">
      <!-- Header -->
      <header class="flex items-center gap-3 mb-6">
        <a
          routerLink="/lists"
          class="btn-icon"
          [attr.aria-label]="'common.back' | transloco"
        >
          <app-icon name="arrow-left" [size]="20" />
        </a>
        <div class="flex-1 min-w-0">
          @if (editingTitle()) {
            <input
              [(ngModel)]="editName"
              (blur)="saveTitle()"
              (keyup.enter)="saveTitle()"
              class="form-input text-xl font-bold"
              autofocus
            />
          } @else {
            <h1
              class="text-xl font-bold text-zinc-900 dark:text-white truncate cursor-pointer"
              (click)="startEditTitle()"
            >
              {{ list()?.name ?? '' }}
            </h1>
          }
          @if (list()?.description) {
            <p class="text-sm text-zinc-500 mt-0.5 truncate">
              {{ list()?.description }}
            </p>
          }
        </div>
        <button
          (click)="confirmDelete()"
          class="btn-icon text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          [attr.aria-label]="'common.delete' | transloco"
        >
          <app-icon name="trash-2" [size]="17" />
        </button>
      </header>

      <!-- Progress bar -->
      @if (items().length > 0) {
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {{ checkedCount() }} / {{ items().length }}
              {{ 'lists.items_done' | transloco }}
            </span>
            <span
              class="text-sm font-semibold"
              [class]="
                progressPercent() === 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-brand-600 dark:text-brand-400'
              "
            >
              {{ progressPercent() }}%
            </span>
          </div>
          <div
            class="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
          >
            <div
              class="h-full rounded-full transition-all duration-500"
              [class]="
                progressPercent() === 100 ? 'bg-emerald-500' : 'bg-brand-500'
              "
              [style.width.%]="progressPercent()"
            ></div>
          </div>
          @if (progressPercent() === 100) {
            <p
              class="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2 text-center animate-scale-in"
            >
              🎉 {{ 'lists.all_done' | transloco }}
            </p>
          }
        </div>

        <!-- Uncheck all -->
        @if (checkedCount() > 0) {
          <div class="flex justify-end mb-4">
            <button
              (click)="uncheckAll()"
              class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {{ 'lists.uncheck_all' | transloco }}
            </button>
          </div>
        }
      }

      <!-- Items list -->
      @if (items().length === 0) {
        <div
          class="flex flex-col items-center py-12 text-center
                    rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700
                    bg-white dark:bg-zinc-900 mb-6"
        >
          <app-icon
            name="clipboard-list"
            [size]="32"
            class="text-zinc-300 dark:text-zinc-600 mb-3"
          />
          <p class="text-sm text-zinc-500">
            {{ 'lists.empty_items' | transloco }}
          </p>
        </div>
      } @else {
        <ul class="space-y-2 mb-6" role="list">
          @for (item of items(); track item.id) {
            <li
              class="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800
                       hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors group"
            >
              <!-- Checkbox -->
              <button
                (click)="listStore.toggleItem(item.id)"
                class="shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150"
                [class]="
                  item.checked
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-400'
                "
                [attr.aria-label]="'lists.toggle' | transloco"
              >
                @if (item.checked) {
                  <app-icon name="check" [size]="12" aria-hidden="true" />
                }
              </button>

              <!-- Label -->
              <span
                class="flex-1 text-[15px] transition-all duration-200"
                [class]="
                  item.checked
                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                    : 'text-zinc-900 dark:text-zinc-100'
                "
              >
                @if (item.object_id) {
                  {{ getObjectName(item.object_id) }}
                  @if (getObjectCategory(item.object_id)) {
                    <span class="ml-2 text-xs text-zinc-400">{{
                      getObjectCategory(item.object_id)
                    }}</span>
                  }
                } @else {
                  {{ item.custom_label }}
                }
              </span>

              <!-- Remove -->
              <button
                (click)="listStore.removeItem(item.id)"
                class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity
                             w-6 h-6 flex items-center justify-center rounded-lg
                             text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                [attr.aria-label]="'common.delete' | transloco"
              >
                <app-icon name="x" [size]="13" aria-hidden="true" />
              </button>
            </li>
          }
        </ul>
      }

      <!-- Add item section -->
      <div
        class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
      >
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          {{ 'lists.add_item' | transloco }}
        </h2>

        <!-- Toggle: from objects / custom -->
        <div class="flex gap-2 mb-3">
          <button
            (click)="addMode.set('object')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            [class]="
              addMode() === 'object'
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            "
          >
            {{ 'lists.from_objects' | transloco }}
          </button>
          <button
            (click)="addMode.set('custom')"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            [class]="
              addMode() === 'custom'
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            "
          >
            {{ 'lists.custom_item' | transloco }}
          </button>
        </div>

        @if (addMode() === 'object') {
          <!-- Search objects -->
          <div class="relative mb-2">
            <app-icon
              name="search"
              [size]="15"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              [(ngModel)]="objectQuery"
              [placeholder]="'lists.search_objects' | transloco"
              class="form-input pl-9 text-sm"
            />
          </div>
          @if (filteredObjects().length > 0) {
            <ul class="max-h-48 overflow-y-auto space-y-1" role="list">
              @for (obj of filteredObjects(); track obj.id) {
                <li>
                  <button
                    (click)="addObject(obj.id)"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    @if (obj.image_uri) {
                      <img
                        [src]="obj.image_uri"
                        [alt]="obj.name"
                        class="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                    } @else {
                      <span
                        class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"
                      >
                        <app-icon
                          name="package"
                          [size]="14"
                          class="text-zinc-400"
                        />
                      </span>
                    }
                    <span class="flex-1 min-w-0">
                      <span
                        class="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
                        >{{ obj.name }}</span
                      >
                      @if (obj.category) {
                        <span class="block text-xs text-zinc-400 truncate">{{
                          obj.category
                        }}</span>
                      }
                    </span>
                    <app-icon
                      name="plus"
                      [size]="14"
                      class="text-zinc-400 shrink-0"
                    />
                  </button>
                </li>
              }
            </ul>
          } @else if (objectQuery.length > 0) {
            <p class="text-sm text-zinc-400 text-center py-4">
              {{ 'search.no_results' | transloco }}
            </p>
          }
        } @else {
          <!-- Custom text item -->
          <div class="flex gap-2">
            <input
              [(ngModel)]="customLabel"
              [placeholder]="'lists.custom_placeholder' | transloco"
              class="form-input flex-1 text-sm"
              (keyup.enter)="addCustom()"
            />
            <button
              (click)="addCustom()"
              [disabled]="!customLabel.trim()"
              class="btn-primary px-3"
            >
              <app-icon name="plus" [size]="15" />
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ListDetailComponent implements OnInit {
  listStore = inject(ListStore);
  private objectStore = inject(ObjectStore);
  private route = inject(ActivatedRoute);

  listId = signal('');
  editingTitle = signal(false);
  editName = '';
  addMode = signal<'object' | 'custom'>('object');
  objectQuery = '';
  customLabel = '';

  list = computed(() => this.listStore.getListById()(this.listId()));
  items = computed(() => this.listStore.getItemsByList()(this.listId()));
  checkedCount = computed(() => this.items().filter((i) => i.checked).length);
  progressPercent = computed(() => {
    const total = this.items().length;
    if (total === 0) return 0;
    return Math.round((this.checkedCount() / total) * 100);
  });

  filteredObjects = computed(() => {
    const q = this.objectQuery.toLowerCase().trim();
    const addedObjectIds = new Set(
      this.items()
        .map((i) => i.object_id)
        .filter(Boolean),
    );
    return this.objectStore
      .objects()
      .filter(
        (o) =>
          !addedObjectIds.has(o.id) &&
          (!q ||
            o.name.toLowerCase().includes(q) ||
            o.category.toLowerCase().includes(q)),
      );
  });

  ngOnInit() {
    this.route.params.subscribe((p) => this.listId.set(p['id'] ?? ''));
  }

  getObjectName(objectId: string): string {
    return this.objectStore.getById()(objectId)?.name ?? objectId;
  }

  getObjectCategory(objectId: string): string {
    return this.objectStore.getById()(objectId)?.category ?? '';
  }

  startEditTitle() {
    this.editName = this.list()?.name ?? '';
    this.editingTitle.set(true);
  }

  async saveTitle() {
    if (this.editName.trim()) {
      await this.listStore.updateList(this.listId(), {
        name: this.editName.trim(),
      });
    }
    this.editingTitle.set(false);
  }

  async addObject(objectId: string) {
    await this.listStore.addItem(this.listId(), {
      object_id: objectId,
      custom_label: null,
    });
    this.objectQuery = '';
  }

  async addCustom() {
    if (!this.customLabel.trim()) return;
    await this.listStore.addItem(this.listId(), {
      object_id: null,
      custom_label: this.customLabel.trim(),
    });
    this.customLabel = '';
  }

  async uncheckAll() {
    await this.listStore.uncheckAll(this.listId());
  }

  async confirmDelete() {
    if (!confirm('Delete this list?')) return;
    await this.listStore.deleteList(this.listId());
    history.back();
  }
}
