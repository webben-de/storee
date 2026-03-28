import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from './components/icon.component';
import { SettingsStore } from '@storee/data-access-settings';
import { LocationStore } from '@storee/data-access-locations';
import { ObjectStore } from '@storee/data-access-objects';

@Component({
  imports: [RouterModule, CommonModule, TranslocoModule, IconComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private settingsStore = inject(SettingsStore);
  private locationStore = inject(LocationStore);
  private objectStore = inject(ObjectStore);
  private router = inject(Router);

  showNav = true;

  readonly navItems = [
    { path: '/', label: 'nav.home', icon: 'house' },
    { path: '/search', label: 'nav.search', icon: 'search' },
    { path: '/graph', label: 'nav.graph', icon: 'git-graph' },
    { path: '/settings', label: 'nav.settings', icon: 'settings' },
  ];

  async ngOnInit() {
    await this.settingsStore.load();
    this.locationStore.loadAll(undefined as never);
    this.objectStore.loadAll(undefined as never);

    const theme = this.settingsStore.theme();
    document.documentElement.classList.toggle('dark', theme === 'dark');

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.showNav = !(e as NavigationEnd).url.startsWith('/lock');
      });
  }
}

