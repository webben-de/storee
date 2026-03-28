import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';

@Component({
  selector: 'lib-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslocoModule, IconComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 lg:px-6">

      <!-- Sticky search bar -->
      <div class="sticky top-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-lg
                  pt-6 pb-4 z-10">
        <label for="search-input" class="sr-only">{{ 'search.placeholder' | transloco }}</label>
        <div class="relative">
          <app-icon name="search" [size]="17"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            aria-hidden="true" />
          <input
            id="search-input"
            type="search"
            [(ngModel)]="query"
            [placeholder]="'search.placeholder' | transloco"
            class="form-input pl-10 text-[15px]"
            style="height: 48px;"
            autofocus
          />
          @if (query.length > 0) {
            <button
              (click)="query = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
                     rounded-full bg-zinc-300 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200
                     hover:bg-zinc-400 dark:hover:bg-zinc-500 transition-colors"
              aria-label="Clear search"
            >
              <app-icon name="x" [size]="11" aria-hidden="true" />
            </button>
          }
        </div>
      </div>

      <div class="py-4 space-y-8">
        @if (query.length === 0) {
          <!-- Idle empty state -->
          <div class="flex flex-col items-center py-16 text-center">
            <div class="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <app-icon name="search" [size]="24" class="text-zinc-400" aria-hidden="true" />
            </div>
            <p class="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">Find anything</p>
            <p class="text-sm text-zinc-500 max-w-[32ch] leading-relaxed">
              Search by name, description, category, or tag.
            </p>
          </div>

        } @else if (matchedLocations().length === 0 && matchedObjects().length === 0) {
          <!-- No results -->
          <div class="flex flex-col items-center py-12 text-center">
            <div class="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <app-icon name="search" [size]="24" class="text-zinc-400" aria-hidden="true" />
            </div>
            <p class="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              {{ 'search.no_results' | transloco }}
            </p>
            <p class="text-sm text-zinc-400">No matches for <strong class="font-medium text-zinc-700 dark:text-zinc-300">"{{ query }}"</strong></p>
          </div>

        } @else {

          <!-- Location results -->
          @if (matchedLocations().length > 0) {
            <section>
              <h2 class="section-label mb-3">{{ 'search.results_locations' | transloco }}</h2>
              <ul class="space-y-2" role="list">
                @for (loc of matchedLocations(); track loc.id; let i = $index) {
                  <li class="stagger-item" [style.--index]="i">
                    <a [routerLink]="['/location', loc.id]" class="card-row">
                      <span class="flex items-center justify-center w-9 h-9 rounded-xl
                                   bg-brand-50 dark:bg-brand-950/50 shrink-0">
                        <app-icon name="folder" [size]="16" class="text-brand-600 dark:text-brand-400" aria-hidden="true" />
                      </span>
                      <div class="flex-1 min-w-0">
                        <p class="text-[15px] font-[550] text-zinc-900 dark:text-zinc-100 truncate">{{ loc.name }}</p>
                        @if (loc.description) {
                          <p class="text-xs text-zinc-400 mt-0.5 truncate">{{ loc.description }}</p>
                        }
                      </div>
                      <app-icon name="chevron-right" [size]="16" class="text-zinc-400 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          <!-- Object results -->
          @if (matchedObjects().length > 0) {
            <section>
              <h2 class="section-label mb-3">{{ 'search.results_objects' | transloco }}</h2>
              <ul class="space-y-2" role="list">
                @for (obj of matchedObjects(); track obj.id; let i = $index) {
                  <li class="stagger-item" [style.--index]="i + matchedLocations().length">
                    <a [routerLink]="['/object', obj.id]" class="card-row">
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
                        @if (obj.category) {
                          <p class="text-xs text-zinc-400 mt-0.5 truncate">{{ obj.category }}</p>
                        }
                      </div>
                      <app-icon name="chevron-right" [size]="16" class="text-zinc-400 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                }
              </ul>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class SearchComponent {
  private locationStore = inject(LocationStore);
  private objectStore = inject(ObjectStore);
  query = '';

  matchedLocations = computed(() => {
    const q = this.query.toLowerCase();
    if (!q) return [];
    return this.locationStore.locations().filter(
      (l) => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q),
    );
  });

  matchedObjects = computed(() => {
    const q = this.query.toLowerCase();
    if (!q) return [];
    return this.objectStore.objects().filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q)),
    );
  });
}
