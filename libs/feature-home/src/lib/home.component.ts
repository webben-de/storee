import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';

@Component({
  selector: 'lib-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule, IconComponent],
  styles: [`
    :host { display: block; }
  `],
  template: `
    <div class="max-w-2xl mx-auto px-4 lg:px-6 py-8">

      <!-- Header — left-aligned, asymmetric (DESIGN_VARIANCE 8) -->
      <header class="mb-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="section-label mb-1">{{ 'nav.home' | transloco }}</p>
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              {{ 'home.title' | transloco }}
            </h1>
            @if (totalCount() > 0) {
              <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span class="font-medium text-zinc-700 dark:text-zinc-300">{{ locationStore.rootLocations().length }}</span>
                {{ locationStore.rootLocations().length === 1 ? 'location' : 'locations' }}
                &nbsp;·&nbsp;
                <span class="font-medium text-zinc-700 dark:text-zinc-300">{{ totalObjects() }}</span>
                {{ totalObjects() === 1 ? 'object' : 'objects' }}
              </p>
            }
          </div>
          <button
            (click)="addLocation()"
            class="btn-primary shrink-0"
            [attr.aria-label]="'home.add_location' | transloco"
          >
            <app-icon name="plus" [size]="15" aria-hidden="true" />
            {{ 'home.add_location' | transloco }}
          </button>
        </div>
      </header>

      <!-- Empty state — premium composed -->
      @if (locationStore.rootLocations().length === 0) {
        <div class="animate-scale-in
                    flex flex-col items-start py-16 px-6
                    rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700
                    bg-white dark:bg-zinc-900">
          <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
            <app-icon name="package" [size]="22" class="text-zinc-400" aria-hidden="true" />
          </div>
          <p class="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            {{ 'home.empty' | transloco }}
          </p>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-[40ch] leading-relaxed mb-6">
            Create your first location to start tracking where things live — room, shelf, box, or anywhere.
          </p>
          <button (click)="addLocation()" class="btn-primary">
            <app-icon name="plus" [size]="15" aria-hidden="true" />
            Add first location
          </button>
        </div>

      } @else {
        <!-- Location list — staggered reveal -->
        <ul class="space-y-2" role="list">
          @for (loc of locationStore.rootLocations(); track loc.id; let i = $index) {
            <li class="stagger-item" [style.--index]="i">
              <a [routerLink]="['/location', loc.id]" class="card-row">

                <!-- Icon badge -->
                <span class="flex items-center justify-center w-10 h-10 rounded-xl
                             bg-brand-50 dark:bg-brand-950/50
                             text-brand-600 dark:text-brand-400 shrink-0">
                  <app-icon name="folder" [size]="18" aria-hidden="true" />
                </span>

                <!-- Text -->
                <div class="flex-1 min-w-0">
                  <p class="text-[15px] font-[550] text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                    {{ loc.name }}
                  </p>
                  @if (loc.description) {
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ loc.description }}</p>
                  } @else if (childCount(loc.id); as count) {
                    <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ count }}</p>
                  }
                </div>

                <!-- Count badge -->
                @if (childCount(loc.id); as count) {
                  @if (!loc.description) {} @else {
                    <span class="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 hidden sm:block">
                      {{ count }}
                    </span>
                  }
                }

                <app-icon name="chevron-right" [size]="16" class="text-zinc-400 shrink-0 ml-1" aria-hidden="true" />
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class HomeComponent {
  readonly locationStore = inject(LocationStore);
  private readonly objectStore = inject(ObjectStore);
  private router = inject(Router);

  totalCount = computed(() =>
    this.locationStore.rootLocations().length + this.objectStore.objects().length
  );

  totalObjects = computed(() => this.objectStore.objects().length);

  childCount(locationId: string): string {
    const locs = this.locationStore.getChildren()(locationId).length;
    const objs = this.objectStore.getByLocation()(locationId).length;
    const parts: string[] = [];
    if (locs > 0) parts.push(`${locs} ${locs === 1 ? 'folder' : 'folders'}`);
    if (objs > 0) parts.push(`${objs} ${objs === 1 ? 'item' : 'items'}`);
    return parts.join(' · ');
  }

  addLocation() {
    this.router.navigate(['/location', 'new']);
  }
}
