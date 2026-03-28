import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { db } from '@storee/data-access-db';

const SESSION_KEY = 'storee_unlocked';

export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(pin: string): Promise<boolean> {
  const setting = await db.settings.get('pin_hash');
  if (!setting) return true; // no PIN set — always unlocked
  const hash = await hashPin(pin);
  return hash === setting.value;
}

export function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function unlockSession(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function lockSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export const AuthGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const pinSetting = await db.settings.get('pin_hash');
  if (!pinSetting) return true; // no PIN configured
  if (isSessionUnlocked()) return true;
  return router.createUrlTree(['/lock']);
};
