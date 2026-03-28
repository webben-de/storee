import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ObjectStore } from '@storee/data-access-objects';
import { LocationStore } from '@storee/data-access-locations';

@Component({
  selector: 'lib-object-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslocoModule, IconComponent],
  template: `
    <div class="p-4 lg:p-6 max-w-lg mx-auto">
      <header class="flex items-center gap-3 mb-6">
        <button (click)="back()" class="btn-icon" [attr.aria-label]="'common.back' | transloco">
          <app-icon name="arrow-left" [size]="20" />
        </button>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ (isEdit() ? 'object.edit' : 'object.new') | transloco }}
        </h1>
      </header>

      <form (ngSubmit)="save()" class="space-y-5">
        <div>
          <label for="obj-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.name' | transloco }}</label>
          <input id="obj-name" [(ngModel)]="form.name" name="name" required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>

        <div>
          <label for="obj-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.description' | transloco }}</label>
          <textarea id="obj-desc" [(ngModel)]="form.description" name="description" rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="obj-cat" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.category' | transloco }}</label>
            <input id="obj-cat" [(ngModel)]="form.category" name="category"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label for="obj-qty" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.quantity' | transloco }}</label>
            <input id="obj-qty" type="number" [(ngModel)]="form.quantity" name="quantity" min="1"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        <div>
          <label for="obj-tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.tags' | transloco }}</label>
          <input id="obj-tags" [ngModel]="form.tags.join(', ')" (ngModelChange)="setTags($event)" name="tags"
            placeholder="tag1, tag2, tag3"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400" />
          <p class="text-xs text-gray-400 mt-1">Separate with commas</p>
        </div>

        <div>
          <label for="obj-photo" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ 'object.photo' | transloco }}</label>
          <input id="obj-photo" type="file" accept="image/*" (change)="onPhoto($event)"
            class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          @if (form.image_uri) {
            <img [src]="form.image_uri" alt="preview" class="mt-2 w-24 h-24 rounded-lg object-cover" />
          }
        </div>

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
export class ObjectFormComponent implements OnInit {
  id = input<string | undefined>(undefined);
  private objectStore = inject(ObjectStore);
  private locationStore = inject(LocationStore);
  private router = inject(Router);

  isEdit = signal(false);
  form = { name: '', description: '', category: '', tags: [] as string[], quantity: 1, image_uri: null as string | null, location_id: '' };

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    this.form.location_id = params.get('location') ?? '';
    if (this.id() && this.id() !== 'new') {
      this.isEdit.set(true);
      const o = this.objectStore.getById()(this.id()!);
      if (o) this.form = { name: o.name, description: o.description, category: o.category, tags: [...o.tags], quantity: o.quantity, image_uri: o.image_uri, location_id: o.location_id };
    }
  }

  setTags(value: string) {
    this.form.tags = value.split(',').map((t) => t.trim()).filter(Boolean);
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { this.form.image_uri = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  async save() {
    if (!this.form.name) return;
    if (this.isEdit()) {
      await this.objectStore.update(this.id()!, this.form);
      this.router.navigate(['/object', this.id()]);
    } else {
      const id = await this.objectStore.create({ ...this.form, gps_lat: null, gps_lng: null });
      this.router.navigate(['/object', id]);
    }
  }

  async delete() {
    if (!confirm('Delete this object?')) return;
    await this.objectStore.remove(this.id()!);
    history.back();
  }

  back() { history.back(); }
}
