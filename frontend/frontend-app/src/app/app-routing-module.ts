import { Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { ArtistListComponent } from './artist-list/artist-list.component';
import { ArtistDetailComponent } from './artist-detail/artist-detail.component';


export const routes: Routes = [
  { path: 'events', component: EventListComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'artists', component: ArtistListComponent },
  { path: 'artists/:id', component: ArtistDetailComponent },
  { path: '', redirectTo: '/events', pathMatch: 'full' },
];