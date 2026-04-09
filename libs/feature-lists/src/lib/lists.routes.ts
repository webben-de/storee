import { Route } from '@angular/router';
import { ListsComponent } from './lists.component';
import { ListDetailComponent } from './list-detail.component';

export const LISTS_ROUTES: Route[] = [
  { path: '', component: ListsComponent },
  { path: ':id', component: ListDetailComponent },
];
