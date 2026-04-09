import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ListStore } from '@storee/data-access-lists';

@Component({
  selector: 'lib-lists',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslocoModule,
    IconComponent,
  ],
  template: `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-8">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-label mb-1">{{ 'nav.lists' | transloco }}</p>
            <h1
              class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none"
            >
              {{ 'lists.title' | transloco }}
            </h1>
            @if (listStore.lists().length > 0) {
              <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span class="font-medium text-zinc-700 dark:text-zinc-300">{{
                  listStore.lists().length
                }}</span>
                {{
                  listStore.lists().length === 1
                    ? ('lists.list_single' | transloco)
                    : ('lists.list_plural' | transloco)
                }}
              </p>
            }
          </div>
          <button
            (click)="showCreate.set(true)"
            class="btn-primary shrink-0"
            [attr.aria-label]="'lists.new' | transloco"
          >
            <app-icon name="plus" [size]="15" aria-hidden="true" />
            {{ 'lists.new' | transloco }}
          </button>
        </div>
      </header>

      <!-- Create form (inline) -->
      @if (showCreate()) {
        <div
          class="mb-6 p-4 rounded-2xl border border-brand-200 dark:border-brand-800
                    bg-brand-50/50 dark:bg-brand-950/30 animate-scale-in"
        >
          <h2
            class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3"
          >
            {{ 'lists.new' | transloco }}
          </h2>
          <div class="space-y-3">
            <input
              [(ngModel)]="newName"
              [placeholder]="'lists.name_placeholder' | transloco"
              class="form-input"
              (keyup.enter)="createList()"
              autofocus
            />
            <input
              [(ngModel)]="newDesc"
              [placeholder]="'lists.desc_placeholder' | transloco"
              class="form-input"
              (keyup.enter)="createList()"
            />
            <div class="flex gap-2">
              <button
                (click)="createList()"
                [disabled]="!newName.trim()"
                class="btn-primary"
              >
                {{ 'common.save' | transloco }}
              </button>
              <button (click)="cancelCreate()" class="btn-ghost">
                {{ 'common.cancel' | transloco }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty state -->
      @if (listStore.lists().length === 0 && !showCreate()) {
        <div
          class="animate-scale-in flex flex-col items-start py-16 px-6
                    rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700
                    bg-white dark:bg-zinc-900"
        >
          <div
            class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5"
          >
            <app-icon
              name="clipboard-list"
              [size]="22"
              class="text-zinc-400"
              aria-hidden="true"
            />
          </div>
          <p
            class="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1"
          >
            {{ 'lists.empty_title' | transloco }}
          </p>
          <p
            class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[40ch] leading-relaxed mb-6"
          >
            {{ 'lists.empty_hint' | transloco }}
          </p>
          <button (click)="showCreate.set(true)" class="btn-primary">
            <app-icon name="plus" [size]="15" aria-hidden="true" />
            {{ 'lists.new' | transloco }}
          </button>
        </div>
      }

      <!-- Lists -->
      @if (listStore.lists().length > 0) {
        <ul class="space-y-2" role="list">
          @for (list of listStore.lists(); track list.id; let i = $index) {
            <li class="stagger-item" [style.--index]="i">
              <a [routerLink]="['/lists', list.id]" class="card-row group">
                <span
                  class="flex items-center justify-center w-10 h-10 rounded-xl
                             bg-brand-50 dark:bg-brand-950/50 shrink-0"
                >
                  <app-icon
                    name="clipboard-list"
                    [size]="18"
                    class="text-brand-600 dark:text-brand-400"
                    aria-hidden="true"
                  />
                </span>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-[15px] font-[550] text-zinc-900 dark:text-zinc-100 truncate"
                  >
                    {{ list.name }}
                  </p>
                  <p class="text-xs text-zinc-400 mt-0.5 truncate">
                    @if (list.description) {
                      {{ list.description }}
                    } @else {
                      {{ itemCounts()[list.id] ?? 0 }}
                      {{
                        (itemCounts()[list.id] ?? 0) === 1
                          ? ('lists.item_single' | transloco)
                          : ('lists.item_plural' | transloco)
                      }}
                      ·
                      {{ checkedCounts()[list.id] ?? 0 }}
                      {{ 'lists.checked' | transloco }}
                    }
                  </p>
                </div>

                <!-- Progress ring -->
                @if ((itemCounts()[list.id] ?? 0) > 0) {
                  <div class="shrink-0 flex items-center gap-2">
                    <div
                      class="text-xs font-medium tabular-nums"
                      [class]="
                        progressPercent(list.id) === 100
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                      "
                    >
                      {{ progressPercent(list.id) }}%
                    </div>
                  </div>
                }

                <app-icon
                  name="chevron-right"
                  [size]="16"
                  class="text-zinc-400 shrink-0"
                  aria-hidden="true"
                />
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ListsComponent {
  listStore = inject(ListStore);
  private router = inject(Router);

  showCreate = signal(false);
  newName = '';
  newDesc = '';

  itemCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const item of this.listStore.listItems()) {
      counts[item.list_id] = (counts[item.list_id] ?? 0) + 1;
    }
    return counts;
  });

  checkedCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const item of this.listStore.listItems()) {
      if (item.checked) counts[item.list_id] = (counts[item.list_id] ?? 0) + 1;
    }
    return counts;
  });

  progressPercent(listId: string): number {
    const total = this.itemCounts()[listId] ?? 0;
    if (total === 0) return 0;
    const checked = this.checkedCounts()[listId] ?? 0;
    return Math.round((checked / total) * 100);
  }

  async createList() {
    if (!this.newName.trim()) return;
    const id = await this.listStore.createList({
      name: this.newName.trim(),
      description: this.newDesc.trim(),
    });
    this.cancelCreate();
    this.router.navigate(['/lists', id]);
  }

  cancelCreate() {
    this.showCreate.set(false);
    this.newName = '';
    this.newDesc = '';
  }
}
