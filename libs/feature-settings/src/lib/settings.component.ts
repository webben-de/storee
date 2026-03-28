import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { SettingsStore } from '@storee/data-access-settings';
import { hashPin, verifyPin } from '@storee/util-auth';
import { db } from '@storee/data-access-db';
import { exportAll, importAll } from '@storee/data-access-db';

@Component({
  selector: 'lib-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, IconComponent],
  template: `
    <div class="max-w-lg mx-auto px-4 lg:px-6 py-8 space-y-0">

      <!-- Page header -->
      <div class="mb-8">
        <p class="section-label mb-1">{{ 'nav.settings' | transloco }}</p>
        <h1 class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {{ 'settings.title' | transloco }}
        </h1>
      </div>

      <!-- Appearance -->
      <section class="py-6 border-t border-zinc-200 dark:border-zinc-800 stagger-item" [style.--index]="0">
        <h2 class="section-label mb-4">{{ 'settings.theme' | transloco }}</h2>
        <div class="flex gap-3">
          @for (opt of [{id: 'light', icon: 'sun', label: 'settings.theme_light'}, {id: 'dark', icon: 'moon', label: 'settings.theme_dark'}]; track opt.id) {
            <button
              (click)="setTheme(opt.id)"
              class="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 font-medium text-sm transition-all duration-[200ms]"
              style="transition-timing-function: var(--ease-spring)"
              [class.border-brand-500]="settingsStore.theme() === opt.id"
              [class.text-brand-600]="settingsStore.theme() === opt.id"
              [class.bg-brand-50]="settingsStore.theme() === opt.id"
              [class.dark:bg-brand-950/50]="settingsStore.theme() === opt.id"
              [class.border-zinc-200]="settingsStore.theme() !== opt.id"
              [class.dark:border-zinc-700]="settingsStore.theme() !== opt.id"
              [class.text-zinc-600]="settingsStore.theme() !== opt.id"
              [class.dark:text-zinc-400]="settingsStore.theme() !== opt.id"
              [attr.aria-pressed]="settingsStore.theme() === opt.id"
            >
              <app-icon [name]="opt.icon" [size]="16" aria-hidden="true" />
              {{ opt.label | transloco }}
            </button>
          }
        </div>
      </section>

      <!-- Language -->
      <section class="py-6 border-t border-zinc-200 dark:border-zinc-800 stagger-item" [style.--index]="1">
        <h2 class="section-label mb-4">{{ 'settings.language' | transloco }}</h2>
        <div class="flex gap-3">
          @for (lang of langs; track lang.id) {
            <button
              (click)="setLang(lang.id)"
              class="flex-1 h-11 rounded-xl border-2 font-medium text-sm transition-all duration-[200ms]"
              style="transition-timing-function: var(--ease-spring)"
              [class.border-brand-500]="settingsStore.language() === lang.id"
              [class.text-brand-600]="settingsStore.language() === lang.id"
              [class.bg-brand-50]="settingsStore.language() === lang.id"
              [class.dark:bg-brand-950/50]="settingsStore.language() === lang.id"
              [class.border-zinc-200]="settingsStore.language() !== lang.id"
              [class.dark:border-zinc-700]="settingsStore.language() !== lang.id"
              [class.text-zinc-600]="settingsStore.language() !== lang.id"
              [class.dark:text-zinc-400]="settingsStore.language() !== lang.id"
              [attr.aria-pressed]="settingsStore.language() === lang.id"
            >
              {{ lang.label }}
            </button>
          }
        </div>
      </section>

      <!-- Security / PIN -->
      <section class="py-6 border-t border-zinc-200 dark:border-zinc-800 stagger-item" [style.--index]="2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-label">{{ 'settings.pin.title' | transloco }}</h2>
          @if (settingsStore.hasPIN()) {
            <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider
                         text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40
                         px-2.5 py-1 rounded-full">
              <app-icon name="lock" [size]="11" aria-hidden="true" />
              Active
            </span>
          }
        </div>

        @if (pinMessage()) {
          <div class="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
               [class.bg-emerald-50]="pinSuccess()"
               [class.text-emerald-700]="pinSuccess()"
               [class.dark:bg-emerald-950/40]="pinSuccess()"
               [class.dark:text-emerald-400]="pinSuccess()"
               [class.bg-red-50]="!pinSuccess()"
               [class.text-red-600]="!pinSuccess()"
               [class.dark:bg-red-950/40]="!pinSuccess()"
               [class.dark:text-red-400]="!pinSuccess()"
               role="alert">
            {{ pinMessage() }}
          </div>
        }

        <div class="space-y-3">
          @if (settingsStore.hasPIN()) {
            <div>
              <label for="current-pin" class="form-label">{{ 'settings.pin.current' | transloco }}</label>
              <input id="current-pin" type="password" [(ngModel)]="currentPin"
                     maxlength="6" inputmode="numeric" autocomplete="current-password"
                     class="form-input" />
            </div>
          }
          <div>
            <label for="new-pin" class="form-label">{{ 'settings.pin.new' | transloco }}</label>
            <input id="new-pin" type="password" [(ngModel)]="newPin"
                   maxlength="6" inputmode="numeric" autocomplete="new-password"
                   class="form-input" />
          </div>
          <div>
            <label for="confirm-pin" class="form-label">{{ 'settings.pin.confirm' | transloco }}</label>
            <input id="confirm-pin" type="password" [(ngModel)]="confirmPin"
                   maxlength="6" inputmode="numeric" autocomplete="new-password"
                   class="form-input" />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              (click)="savePin()"
              [disabled]="!newPin || newPin.length < 4"
              class="btn-primary flex-1"
            >
              {{ (settingsStore.hasPIN() ? 'settings.pin.change' : 'settings.pin.set') | transloco }}
            </button>
            @if (settingsStore.hasPIN()) {
              <button (click)="removePin()" class="btn-destructive">
                {{ 'settings.pin.remove' | transloco }}
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Backup -->
      <section class="py-6 border-t border-zinc-200 dark:border-zinc-800 stagger-item" [style.--index]="3">
        <h2 class="section-label mb-4">{{ 'settings.backup' | transloco }}</h2>
        <div class="flex gap-3">
          <button (click)="exportData()" class="btn-ghost flex-1 border border-zinc-200 dark:border-zinc-700">
            <app-icon name="download" [size]="15" aria-hidden="true" />
            {{ 'settings.export' | transloco }}
          </button>
          <label class="btn-ghost flex-1 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
            <app-icon name="upload" [size]="15" aria-hidden="true" />
            {{ 'settings.import' | transloco }}
            <input type="file" accept=".json" class="sr-only" (change)="importData($event)" />
          </label>
        </div>
      </section>

    </div>
  `,
})
export class SettingsComponent {
  readonly settingsStore = inject(SettingsStore);
  private transloco = inject(TranslocoService);

  currentPin = '';
  newPin = '';
  confirmPin = '';
  pinMessage = signal('');
  pinSuccess = signal(false);

  readonly langs = [
    { id: 'en', label: 'English' },
    { id: 'de', label: 'Deutsch' },
  ];

  setTheme(theme: string) {
    this.settingsStore.setTheme(theme as 'light' | 'dark');
  }

  setLang(lang: string) {
    this.settingsStore.setLanguage(lang);
    this.transloco.setActiveLang(lang);
  }

  async savePin() {
    if (this.newPin !== this.confirmPin) {
      this.pinMessage.set(this.transloco.translate('settings.pin.mismatch'));
      this.pinSuccess.set(false);
      return;
    }
    if (this.settingsStore.hasPIN()) {
      const ok = await verifyPin(this.currentPin);
      if (!ok) {
        this.pinMessage.set(this.transloco.translate('settings.pin.wrong'));
        this.pinSuccess.set(false);
        return;
      }
    }
    const hash = await hashPin(this.newPin);
    await db.settings.put({ key: 'pin_hash', value: hash });
    await this.settingsStore.load();
    this.currentPin = ''; this.newPin = ''; this.confirmPin = '';
    this.pinMessage.set(this.transloco.translate('settings.pin.saved'));
    this.pinSuccess.set(true);
  }

  async removePin() {
    if (!confirm('Remove PIN lock?')) return;
    await db.settings.delete('pin_hash');
    await this.settingsStore.load();
  }

  exportData() { exportAll(); }

  async importData(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!confirm(this.transloco.translate('settings.import_confirm'))) return;
    await importAll(file);
    window.location.reload();
  }
}
