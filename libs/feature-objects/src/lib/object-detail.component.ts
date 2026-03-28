import { Component, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ObjectStore } from '@storee/data-access-objects';
import { LocationStore } from '@storee/data-access-locations';
import type { StoreeObject, ObjectHistory } from '@storee/data-access-db';

@Component({
  selector: 'lib-object-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, IconComponent],
  template: `
    <div class="p-4 lg:p-6 max-w-2xl mx-auto">
      @if (obj(); as o) {
        <header class="flex items-center gap-2 mb-6">
          <button (click)="back()" class="btn-icon" [attr.aria-label]="'common.back' | transloco">
            <app-icon name="arrow-left" [size]="20" />
          </button>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex-1 truncate">{{ o.name }}</h1>
          <a [routerLink]="['/object', id(), 'edit']" class="btn-icon" [attr.aria-label]="'common.edit' | transloco">
            <app-icon name="pencil" [size]="18" />
          </a>
        </header>

        @if (o.image_uri) {
          <img [src]="o.image_uri" [alt]="o.name" class="w-full h-48 object-cover rounded-2xl mb-6" width="600" height="192" />
        }

        <dl class="space-y-4 mb-6">
          @if (o.description) {
            <div>
              <dt class="text-xs font-semibold uppercase text-gray-500 mb-1">{{ 'object.description' | transloco }}</dt>
              <dd class="text-gray-900 dark:text-white leading-relaxed">{{ o.description }}</dd>
            </div>
          }
          <div class="flex gap-6">
            <div>
              <dt class="text-xs font-semibold uppercase text-gray-500 mb-1">{{ 'object.quantity' | transloco }}</dt>
              <dd class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{{ o.quantity }}</dd>
            </div>
            @if (o.category) {
              <div>
                <dt class="text-xs font-semibold uppercase text-gray-500 mb-1">{{ 'object.category' | transloco }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ o.category }}</dd>
              </div>
            }
          </div>
          @if (o.tags.length > 0) {
            <div>
              <dt class="text-xs font-semibold uppercase text-gray-500 mb-2">{{ 'object.tags' | transloco }}</dt>
              <dd class="flex flex-wrap gap-2">
                @for (tag of o.tags; track tag) {
                  <span class="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium">{{ tag }}</span>
                }
              </dd>
            </div>
          }
          <div>
            <dt class="text-xs font-semibold uppercase text-gray-500 mb-1">{{ 'object.location' | transloco }}</dt>
            <dd>
              <a [routerLink]="['/location', o.location_id]"
                class="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 font-medium min-h-[44px]">
                <app-icon name="folder" [size]="15" aria-hidden="true" />
                {{ locationName() }}
              </a>
            </dd>
          </div>
        </dl>

        <!-- Move history -->
        <section>
          <h2 class="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-4">{{ 'object.history' | transloco }}</h2>
          @if (history().length === 0) {
            <p class="text-sm text-gray-400">{{ 'object.history_empty' | transloco }}</p>
          } @else {
            <ol class="relative border-l-2 border-gray-200 dark:border-gray-700 space-y-4 ml-3" role="list">
              @for (entry of history(); track entry.id) {
                <li class="ml-5">
                  <span class="absolute -left-2 mt-1.5 w-3.5 h-3.5 bg-brand-400 rounded-full border-2 border-white dark:border-gray-950"></span>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ entry.from_location_id ? locationNameById(entry.from_location_id) : '—' }}
                    → {{ locationNameById(entry.to_location_id) }}
                  </p>
                  <time class="text-xs text-gray-400">{{ entry.moved_at | date:'medium' }}</time>
                </li>
              }
            </ol>
          }
        </section>
      }
    </div>
  `,
})
export class ObjectDetailComponent {
  id = input.required<string>();
  private objectStore = inject(ObjectStore);
  private locationStore = inject(LocationStore);
  private router = inject(Router);

  obj = signal<StoreeObject | null>(null);
  history = signal<ObjectHistory[]>([]);
  locationName = signal('');

  constructor() {
    effect(() => {
      const id = this.id();
      const o = this.objectStore.getById()(id);
      this.obj.set(o);
      if (o) {
        this.locationName.set(this.locationStore.getById()(o.location_id)?.name ?? '');
        this.objectStore.getHistory(id).then((h) => this.history.set(h));
      }
    });
  }

  locationNameById(id: string): string {
    return this.locationStore.getById()(id)?.name ?? id;
  }

  back() { history.back(); }
}
