import { Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { EventCreateComponent } from './event-list/event-create.component';

export const routes: Routes = [
  { path: 'events', component: EventListComponent },
  { path: 'events/new', component: EventCreateComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: '', redirectTo: '/events', pathMatch: 'full' },
];