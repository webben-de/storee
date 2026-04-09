import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ObjectStore } from '@storee/data-access-objects';
import { LocationStore } from '@storee/data-access-locations';

const PRESET_CATEGORIES = [
  { label: 'Electronics', emoji: '📱' },
  { label: 'Clothing', emoji: '👕' },
  { label: 'Kitchen', emoji: '🍳' },
  { label: 'Tools', emoji: '🔧' },
  { label: 'Documents', emoji: '📄' },
  { label: 'Books & Media', emoji: '📚' },
  { label: 'Toys & Games', emoji: '🧸' },
  { label: 'Sports', emoji: '🏋️' },
  { label: 'Health', emoji: '💊' },
  { label: 'Furniture', emoji: '🪑' },
  { label: 'Art & Crafts', emoji: '🎨' },
  { label: 'Travel', emoji: '✈️' },
  { label: 'Garden', emoji: '🌿' },
  { label: 'Automotive', emoji: '🚗' },
];

@Component({
  selector: 'lib-object-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslocoModule,
    IconComponent,
  ],
  template: `
    <div class="p-4 lg:p-6 max-w-lg mx-auto">
      <header class="flex items-center gap-3 mb-6">
        <button
          (click)="back()"
          class="btn-icon"
          [attr.aria-label]="'common.back' | transloco"
        >
          <app-icon name="arrow-left" [size]="20" />
        </button>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ (isEdit() ? 'object.edit' : 'object.new') | transloco }}
        </h1>
      </header>

      <form (ngSubmit)="save()" class="space-y-5">
        <!-- Name -->
        <div>
          <label
            for="obj-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ 'object.name' | transloco }}
          </label>
          <input
            id="obj-name"
            [(ngModel)]="form.name"
            name="name"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="obj-desc"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ 'object.description' | transloco }}
          </label>
          <textarea
            id="obj-desc"
            [(ngModel)]="form.description"
            name="description"
            rows="2"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          ></textarea>
        </div>

        <!-- Category picker -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ 'object.category' | transloco }}
          </label>
          <div class="flex flex-wrap gap-2 mb-2">
            @for (cat of presetCategories; track cat.label) {
              <button
                type="button"
                (click)="selectCategory(cat.label)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
                [class]="
                  form.category === cat.label
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/30'
                "
              >
                <span>{{ cat.emoji }}</span>
                <span>{{ cat.label }}</span>
              </button>
            }
            <!-- Custom category toggle -->
            <button
              type="button"
              (click)="toggleCustomCategory()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
              [class]="
                showCustomCategory() ||
                (form.category && !isPresetCategory(form.category))
                  ? 'bg-zinc-800 border-zinc-800 text-white dark:bg-zinc-200 dark:border-zinc-200 dark:text-zinc-900'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              "
            >
              <app-icon name="pencil" [size]="11" />
              <span>{{ 'object.category_custom' | transloco }}</span>
            </button>
          </div>
          @if (
            showCustomCategory() ||
            (form.category && !isPresetCategory(form.category))
          ) {
            <input
              id="obj-cat"
              [(ngModel)]="form.category"
              name="category"
              [placeholder]="'object.category_placeholder' | transloco"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          }
          @if (form.category) {
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >{{ 'object.category_selected' | transloco }}:</span
              >
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
              >
                @if (getCategoryEmoji(form.category); as emoji) {
                  {{ emoji }}
                }
                {{ form.category }}
                <button
                  type="button"
                  (click)="form.category = ''"
                  class="ml-0.5 text-brand-400 hover:text-brand-700"
                >
                  <app-icon name="x" [size]="10" />
                </button>
              </span>
            </div>
          }
        </div>

        <!-- Quantity -->
        <div>
          <label
            for="obj-qty"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ 'object.quantity' | transloco }}
          </label>
          <input
            id="obj-qty"
            type="number"
            [(ngModel)]="form.quantity"
            name="quantity"
            min="1"
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <!-- Tags chip input -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ 'object.tags' | transloco }}
          </label>
          <!-- Chips display -->
          @if (form.tags.length > 0) {
            <div class="flex flex-wrap gap-1.5 mb-2">
              @for (tag of form.tags; track tag) {
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                             bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300
                             border border-brand-200 dark:border-brand-800"
                >
                  {{ tag }}
                  <button
                    type="button"
                    (click)="removeTag(tag)"
                    class="text-brand-400 hover:text-brand-700 dark:hover:text-brand-200 transition-colors"
                    [attr.aria-label]="'Remove tag ' + tag"
                  >
                    <app-icon name="x" [size]="10" />
                  </button>
                </span>
              }
            </div>
          }
          <!-- Tag input -->
          <div class="flex gap-2">
            <input
              #tagInput
              [(ngModel)]="newTag"
              name="tagInput"
              [placeholder]="'object.tags_placeholder' | transloco"
              (keydown.enter)="$event.preventDefault(); addTag()"
              (keydown.comma)="$event.preventDefault(); addTag()"
              class="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
            <button
              type="button"
              (click)="addTag()"
              [disabled]="!newTag.trim()"
              class="px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-colors text-sm font-medium"
            >
              <app-icon name="plus" [size]="15" />
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{ 'object.tags_hint' | transloco }}
          </p>
        </div>

        <!-- Photo -->
        <div>
          <label
            for="obj-photo"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ 'object.photo' | transloco }}
          </label>
          <input
            id="obj-photo"
            type="file"
            accept="image/*"
            (change)="onPhoto($event)"
            class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          @if (form.image_uri) {
            <img
              [src]="form.image_uri"
              alt="preview"
              class="mt-2 w-24 h-24 rounded-lg object-cover"
            />
          }
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            [disabled]="!form.name"
            class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {{ 'common.save' | transloco }}
          </button>
          @if (isEdit()) {
            <button
              type="button"
              (click)="delete()"
              class="px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
            >
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
  showCustomCategory = signal(false);
  newTag = '';
  form = {
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
    quantity: 1,
    image_uri: null as string | null,
    location_id: '',
  };

  readonly presetCategories = PRESET_CATEGORIES;

  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    this.form.location_id = params.get('location') ?? '';
    if (this.id() && this.id() !== 'new') {
      this.isEdit.set(true);
      const o = this.objectStore.getById()(this.id()!);
      if (o)
        this.form = {
          name: o.name,
          description: o.description,
          category: o.category,
          tags: [...o.tags],
          quantity: o.quantity,
          image_uri: o.image_uri,
          location_id: o.location_id,
        };
    }
  }

  selectCategory(label: string) {
    this.form.category = this.form.category === label ? '' : label;
    this.showCustomCategory.set(false);
  }

  toggleCustomCategory() {
    this.showCustomCategory.update((v) => !v);
    if (!this.showCustomCategory()) {
      if (!this.isPresetCategory(this.form.category)) this.form.category = '';
    }
  }

  isPresetCategory(cat: string): boolean {
    return PRESET_CATEGORIES.some((c) => c.label === cat);
  }

  getCategoryEmoji(cat: string): string {
    return PRESET_CATEGORIES.find((c) => c.label === cat)?.emoji ?? '';
  }

  addTag() {
    const tag = this.newTag.trim().replace(/,$/, '');
    if (tag && !this.form.tags.includes(tag)) {
      this.form.tags = [...this.form.tags, tag];
    }
    this.newTag = '';
  }

  removeTag(tag: string) {
    this.form.tags = this.form.tags.filter((t) => t !== tag);
  }

  onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.image_uri = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async save() {
    if (!this.form.name) return;
    if (this.isEdit()) {
      await this.objectStore.update(this.id()!, this.form);
      this.router.navigate(['/object', this.id()]);
    } else {
      const id = await this.objectStore.create({
        ...this.form,
        gps_lat: null,
        gps_lng: null,
      });
      this.router.navigate(['/object', id]);
    }
  }

  async delete() {
    if (!confirm('Delete this object?')) return;
    await this.objectStore.remove(this.id()!);
    history.back();
  }

  back() {
    history.back();
  }
}
