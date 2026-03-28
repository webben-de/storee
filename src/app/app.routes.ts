import { Route } from '@angular/router';
import { AuthGuard } from '@storee/util-auth';

export const appRoutes: Route[] = [
  { path: 'lock', loadChildren: () => import('@storee/feature-lock').then((m) => m.LOCK_ROUTES) },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('@storee/feature-home').then((m) => m.HOME_ROUTES),
      },
      {
        path: 'search',
        loadChildren: () => import('@storee/feature-search').then((m) => m.SEARCH_ROUTES),
      },
      {
        path: 'graph',
        loadChildren: () => import('@storee/feature-graph').then((m) => m.GRAPH_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('@storee/feature-settings').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'location',
        loadChildren: () =>
          import('@storee/feature-locations').then((m) => m.LOCATION_ROUTES),
      },
      {
        path: 'object',
        loadChildren: () => import('@storee/feature-objects').then((m) => m.OBJECT_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
