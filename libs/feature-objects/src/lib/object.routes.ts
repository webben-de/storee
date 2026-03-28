import { Route } from '@angular/router';
import { ObjectDetailComponent } from './object-detail.component';
import { ObjectFormComponent } from './object-form.component';

export const OBJECT_ROUTES: Route[] = [
  { path: 'new', component: ObjectFormComponent },
  { path: ':id', component: ObjectDetailComponent },
  { path: ':id/edit', component: ObjectFormComponent },
];
