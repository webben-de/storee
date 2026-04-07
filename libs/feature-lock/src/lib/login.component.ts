import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { ApiAuthService } from '@storee/util-auth';

type Mode = 'login' | 'register';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, IconComponent],
  template: `
    <div
      class="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-12"
    >
      <div class="w-full max-w-[360px] flex flex-col items-center gap-8">
        <!-- Brand mark -->
        <div class="flex flex-col items-center gap-4">
          <div
            class="flex items-center justify-center w-14 h-14 rounded-2xl
                      bg-brand-600 shadow-lg shadow-brand-600/25"
          >
            <app-icon
              name="package"
              [size]="24"
              class="text-white"
              aria-hidden="true"
            />
          </div>
          <div class="text-center">
            <h1
              class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              {{
                mode() === 'login'
                  ? ('auth.loginTitle' | transloco)
                  : ('auth.registerTitle' | transloco)
              }}
            </h1>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {{
                mode() === 'login'
                  ? ('auth.loginHint' | transloco)
                  : ('auth.registerHint' | transloco)
              }}
            </p>
          </div>
        </div>

        <!-- Form -->
        <form
          class="w-full flex flex-col gap-4"
          (ngSubmit)="submit()"
          #loginForm="ngForm"
          novalidate
        >
          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              for="email"
            >
              {{ 'auth.email' | transloco }}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-zinc-200 dark:border-zinc-800
                     bg-white dark:bg-zinc-900
                     text-zinc-900 dark:text-zinc-100
                     px-4 py-3 text-sm
                     placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                     focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                     transition-all duration-150"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              for="password"
            >
              {{ 'auth.password' | transloco }}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              [autocomplete]="
                mode() === 'login' ? 'current-password' : 'new-password'
              "
              class="w-full rounded-xl border border-zinc-200 dark:border-zinc-800
                     bg-white dark:bg-zinc-900
                     text-zinc-900 dark:text-zinc-100
                     px-4 py-3 text-sm
                     placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                     focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                     transition-all duration-150"
              placeholder="••••••••"
            />
          </div>

          <!-- Error -->
          @if (error()) {
            <p class="text-sm text-red-500 font-medium" role="alert">
              {{ error() }}
            </p>
          }

          <!-- Submit -->
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full h-12 rounded-xl bg-brand-600 text-white font-[500] text-sm
                   hover:bg-brand-700 active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-all duration-[180ms]
                   shadow-md shadow-brand-600/20
                   flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <app-icon
                name="loader-circle"
                [size]="16"
                class="animate-spin"
                aria-hidden="true"
              />
            }
            {{
              mode() === 'login'
                ? ('auth.loginBtn' | transloco)
                : ('auth.registerBtn' | transloco)
            }}
          </button>
        </form>

        <!-- Mode toggle -->
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          {{
            mode() === 'login'
              ? ('auth.noAccount' | transloco)
              : ('auth.hasAccount' | transloco)
          }}
          <button
            type="button"
            (click)="toggleMode()"
            class="text-brand-600 dark:text-brand-400 font-medium hover:underline ml-1"
          >
            {{
              mode() === 'login'
                ? ('auth.registerLink' | transloco)
                : ('auth.loginLink' | transloco)
            }}
          </button>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(ApiAuthService);
  private router = inject(Router);

  mode = signal<Mode>('login');
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  toggleMode() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set(null);
  }

  async submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.mode() === 'login') {
        await this.authService.login(this.email, this.password);
      } else {
        await this.authService.register(this.email, this.password);
      }
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 400) {
        this.error.set('Invalid email or password.');
      } else if (status === 409) {
        this.error.set('An account with this email already exists.');
      } else {
        this.error.set('Something went wrong. Please try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
