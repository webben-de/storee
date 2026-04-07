import {
  Component,
  input,
  output,
  computed,
  signal,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../../../../src/app/components/icon.component';
import type { StoreeObject, Location } from '@storee/data-access-db';
import QRCode from 'qrcode';

const BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://storee.ben-io.de';

@Component({
  selector: 'lib-label-preview',
  standalone: true,
  imports: [CommonModule, TranslocoModule, IconComponent],
  styles: [`
    @media print {
      body > * { display: none !important; }
      lib-label-preview .print-root { display: flex !important; }
      lib-label-preview .no-print { display: none !important; }

      /* Strip the modal chrome — only render .label-card */
      lib-label-preview .modal-backdrop { background: transparent !important; }
      lib-label-preview .modal-panel { box-shadow: none !important; padding: 0 !important; }
    }
  `],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm no-print"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'label.title' | transloco"
    >
      <div
        class="modal-panel relative w-full sm:max-w-sm bg-white dark:bg-zinc-900
               rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {{ 'label.title' | transloco }}
          </h2>
          <button
            (click)="close.emit()"
            class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            [attr.aria-label]="'common.cancel' | transloco"
          >
            <app-icon name="x" [size]="18" class="text-zinc-500" />
          </button>
        </div>

        <!-- Label preview card (also what gets printed) -->
        <div class="print-root flex justify-center">
          <div
            #labelCard
            class="label-card flex items-center gap-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700
                   bg-white p-3 w-full max-w-[340px] shadow-sm"
            style="min-height: 88px;"
          >
            <!-- QR code -->
            <div class="shrink-0 w-[72px] h-[72px]">
              @if (qrDataUrl()) {
                <img
                  [src]="qrDataUrl()"
                  alt="QR code"
                  width="72"
                  height="72"
                  class="block"
                />
              } @else {
                <div class="w-[72px] h-[72px] bg-zinc-100 rounded animate-pulse"></div>
              }
            </div>

            <!-- Text info -->
            <div class="flex-1 min-w-0 flex flex-col gap-0.5">
              <p class="text-sm font-bold text-zinc-900 leading-snug truncate">
                {{ obj().name }}
              </p>
              @if (locationPath().length > 0) {
                <p class="text-[11px] text-zinc-500 leading-snug truncate">
                  {{ locationPathText() }}
                </p>
              }
              <p class="text-[10px] text-zinc-400 leading-snug font-mono mt-1 truncate">
                {{ objectUrl() }}
              </p>
            </div>
          </div>
        </div>

        <!-- URL copyable -->
        <div class="flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2 no-print">
          <span class="text-xs text-zinc-500 font-mono flex-1 truncate">{{ objectUrl() }}</span>
          <button
            (click)="copyUrl()"
            class="shrink-0 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {{ copied() ? ('label.copied' | transloco) : ('label.copy' | transloco) }}
          </button>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 no-print">
          <button
            (click)="downloadPng()"
            class="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700
                   text-zinc-700 dark:text-zinc-300 text-sm font-medium
                   hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors
                   flex items-center justify-center gap-2"
          >
            <app-icon name="download" [size]="16" />
            {{ 'label.download' | transloco }}
          </button>
          <button
            (click)="print()"
            class="flex-1 h-11 rounded-xl bg-brand-600 text-white text-sm font-medium
                   hover:bg-brand-700 active:scale-[0.98] transition-all
                   shadow-md shadow-brand-600/25
                   flex items-center justify-center gap-2"
          >
            <app-icon name="printer" [size]="16" />
            {{ 'label.print' | transloco }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LabelPreviewComponent {
  obj = input.required<StoreeObject>();
  locationPath = input<Location[]>([]);
  close = output<void>();

  labelCard = viewChild<ElementRef<HTMLDivElement>>('labelCard');

  qrDataUrl = signal<string | null>(null);
  copied = signal(false);

  objectUrl = computed(() => `${BASE_URL}/object/${this.obj().id}`);

  locationPathText = computed(() =>
    this.locationPath()
      .map((l) => l.name)
      .join(' › '),
  );

  constructor() {
    effect(() => {
      const url = this.objectUrl();
      QRCode.toDataURL(url, {
        width: 144,
        margin: 1,
        color: { dark: '#18181b', light: '#ffffff' },
      }).then((dataUrl) => this.qrDataUrl.set(dataUrl));
    });
  }

  onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close.emit();
  }

  async copyUrl() {
    await navigator.clipboard.writeText(this.objectUrl());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  async downloadPng() {
    const obj = this.obj();
    const canvas = document.createElement('canvas');
    // 62mm at 203dpi (Brother label printer) ≈ 495px wide, 22mm tall ≈ 134px
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // QR code
    const qrDataUrl = await QRCode.toDataURL(this.objectUrl(), {
      width: 180,
      margin: 1,
      color: { dark: '#18181b', light: '#ffffff' },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, 10, 10, 180, 180);

    // Text
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(obj.name, 210, 52, 370);

    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    if (this.locationPath().length > 0) {
      ctx.fillText(this.locationPathText(), 210, 82, 370);
    }

    ctx.font = '14px monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(this.objectUrl(), 210, 112, 370);

    const link = document.createElement('a');
    link.download = `label-${obj.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  print() {
    window.print();
  }
}
