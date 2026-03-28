import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { LocationStore } from '@storee/data-access-locations';

const ICONS = ['📁','🏠','🏢','🏪','🚗','🛏️','🪑','🚪','📦','🧳','🗄️','🪣','🔧','🔑','🎒','🧊','🛒','🖥️'];

@Component({
  selector: 'lib-location-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule, IconComponent],
  template: `
    <div class="p-4 lg:p-6 max-w-lg mx-auto">
      <header class="flex items-center gap-3 mb-6">
        <button (click)="back()" class="btn-icon" [attr.aria-label]="'common.back' | transloco">
          <app-icon name="arrow-left" [size]="20" />
        </button>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ (isEdit() ? 'location.edit' : 'location.new') | transloco }}
        </h1>
      </header>

      <form (ngSubmit)="save()" class="space-y-5">
        <!-- Name -->
        <div>
          <label for="loc-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'location.name' | transloco }}</label>
          <input id="loc-name" [(ngModel)]="form.name" name="name" required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>

        <!-- Description -->
        <div>
          <label for="loc-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'location.description' | transloco }}</label>
          <textarea id="loc-desc" [(ngModel)]="form.description" name="description" rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"></textarea>
        </div>

        <!-- Icon picker -->
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ 'location.icon' | transloco }}</p>
          <div class="flex flex-wrap gap-2" role="radiogroup" [attr.aria-label]="'location.icon' | transloco">
            @for (icon of icons; track icon) {
              <button type="button" (click)="form.icon = icon"
                class="text-2xl p-2 rounded-lg border-2 transition-colors"
                [class.border-brand-500]="form.icon === icon"
                [class.border-transparent]="form.icon !== icon"
                [class.bg-brand-50]="form.icon === icon"
                [attr.aria-label]="icon" [attr.aria-pressed]="form.icon === icon">
                {{ icon }}
              </button>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="!form.name"
            class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
            {{ 'common.save' | transloco }}
          </button>
          @if (isEdit()) {
            <button type="button" (click)="delete()"
              class="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
              {{ 'common.delete' | transloco }}
            </button>
          }
        </div>
      </form>
    </div>
  `,
})
export class LocationFormComponent implements OnInit {
  id = input<string | undefined>(undefined);
  private locationStore = inject(LocationStore);
  private router = inject(Router);

  readonly icons = ICONS;
  isEdit = signal(false);
  form = { name: '', description: '', icon: '📁' };
  private parentId: string | null = null;

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    this.parentId = params.get('parent');
    if (this.id() && this.id() !== 'new') {
      this.isEdit.set(true);
      const loc = this.locationStore.getById()(this.id()!);
      if (loc) this.form = { name: loc.name, description: loc.description, icon: loc.icon };
    }
  }

  async save() {
    if (!this.form.name) return;
    if (this.isEdit()) {
      await this.locationStore.update(this.id()!, this.form);
      this.router.navigate(['/location', this.id()]);
    } else {
      const id = await this.locationStore.create({
        ...this.form,
        parent_id: this.parentId,
        gps_lat: null, gps_lng: null,
        image_uri: null,
        sort_order: Date.now(),
      });
      this.router.navigate(['/location', id]);
    }
  }

  async delete() {
    if (!confirm('Delete this location?')) return;
    await this.locationStore.remove(this.id()!);
    this.router.navigate(['/']);
  }

  back() { history.back(); }
}
