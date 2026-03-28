import { Route } from '@angular/router';
import { LocationDetailComponent } from './location-detail.component';
import { LocationFormComponent } from './location-form.component';

export const LOCATION_ROUTES: Route[] = [
  { path: 'new', component: LocationFormComponent },
  { path: ':id', component: LocationDetailComponent },
  { path: ':id/edit', component: LocationFormComponent },
];
