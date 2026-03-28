import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import { verifyPin, unlockSession } from '@storee/util-auth';

@Component({
  selector: 'lib-lock',
  standalone: true,
  imports: [CommonModule, TranslocoModule, IconComponent],
  styles: [`
    :host { display: block; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .shake { animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

    @keyframes dotPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      100% { transform: scale(1); }
    }
    .dot-filled { animation: dotPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
  `],
  template: `
    <div class="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-12">
      <div class="w-full max-w-[320px] flex flex-col items-center gap-10">

        <!-- Brand mark + title -->
        <div class="flex flex-col items-center gap-4">
          <div class="flex items-center justify-center w-14 h-14 rounded-2xl
                      bg-brand-600 shadow-lg shadow-brand-600/25">
            <app-icon name="lock" [size]="24" class="text-white" aria-hidden="true" />
          </div>
          <div class="text-center">
            <h1 class="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {{ 'lock.title' | transloco }}
            </h1>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ 'lock.hint' | transloco }}</p>
          </div>
        </div>

        <!-- PIN dots -->
        <div
          class="flex items-center gap-3.5"
          [class.shake]="shaking()"
          role="status"
          [attr.aria-label]="pin().length + ' digits entered'"
        >
          @for (i of [0,1,2,3,4,5]; track i) {
            <div
              class="w-3 h-3 rounded-full border-2 transition-colors duration-150"
              [class.bg-brand-600]="pin().length > i"
              [class.border-brand-600]="pin().length > i"
              [class.dot-filled]="pin().length - 1 === i"
              [class.border-zinc-300]="pin().length <= i"
              [class.dark:border-zinc-600]="pin().length <= i"
            ></div>
          }
        </div>

        @if (error()) {
          <p class="text-sm text-red-500 font-medium -mt-6" role="alert">{{ 'lock.wrong' | transloco }}</p>
        }

        <!-- Keypad -->
        <div class="grid grid-cols-3 gap-3 w-full" role="group" [attr.aria-label]="'lock.title' | transloco">
          @for (key of keypad; track $index) {
            <button
              (click)="press(key)"
              [disabled]="key === ''"
              class="h-[64px] rounded-2xl text-xl font-[500] tracking-tight
                     bg-white dark:bg-zinc-900
                     border border-zinc-200/80 dark:border-zinc-800
                     text-zinc-900 dark:text-zinc-100
                     hover:bg-brand-50 dark:hover:bg-zinc-800 hover:border-brand-400/50
                     active:scale-[0.93] active:bg-brand-100/80
                     transition-all duration-[180ms] disabled:opacity-0
                     shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              style="transition-timing-function: var(--ease-spring)"
              [attr.aria-label]="key"
            >
              {{ key }}
            </button>
          }

          <!-- Backspace in last cell -->
          <button
            (click)="backspace()"
            class="h-[64px] rounded-2xl
                   bg-white dark:bg-zinc-900
                   border border-zinc-200/80 dark:border-zinc-800
                   text-zinc-500 dark:text-zinc-400
                   hover:bg-zinc-100 dark:hover:bg-zinc-800
                   active:scale-[0.93]
                   transition-all duration-[180ms]
                   flex items-center justify-center
                   shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            style="transition-timing-function: var(--ease-spring)"
            aria-label="Delete last digit"
          >
            <app-icon name="arrow-left" [size]="20" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LockComponent {
  private router = inject(Router);

  pin = signal('');
  error = signal(false);
  shaking = signal(false);

  readonly keypad = ['1','2','3','4','5','6','7','8','9','','0'];

  press(key: string) {
    if (!key || this.pin().length >= 6) return;
    this.pin.update((p) => p + key);
    this.error.set(false);
    if (this.pin().length === 6) this.verify();
  }

  backspace() {
    this.pin.update((p) => p.slice(0, -1));
    this.error.set(false);
  }

  async verify() {
    const ok = await verifyPin(this.pin());
    if (ok) {
      unlockSession();
      this.router.navigate(['/']);
    } else {
      this.error.set(true);
      this.shaking.set(true);
      setTimeout(() => {
        this.shaking.set(false);
        this.pin.set('');
      }, 380);
    }
  }
}
