import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Imports Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatRippleModule } from '@angular/material/core';

interface Event {
  id: number;
  label: string;
  startDate: string;
  endDate: string;
  artists: any[];
}

interface PageResponse {
  content: Event[];
  totalPages: number;
  number: number;
  size: number;
  totalElements: number;
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatRippleModule
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  currentPage = 0;
  pageSize = 5;
  totalPages = 1;
  totalElements = 0;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.fetchEvents();
  }

  fetchEvents() {
    this.isLoading = true;
    this.errorMessage = null;
    
    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('size', this.pageSize.toString());

    this.http.get<PageResponse>('http://localhost:8080/events', { params })
      .subscribe({
        next: (response) => {
          this.events = response.content;
          this.totalPages = response.totalPages;
          this.totalElements = response.totalElements || 0;
          this.currentPage = response.number;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = `Erreur serveur: ${error.status} - ${error.statusText}`;
          this.isLoading = false;
          
          // Notification Material
          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  getPaginatedEvents() {
    return this.events;
  }

  // Gestion de la pagination Material
  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.fetchEvents();
  }

  // Méthodes de formatage
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  getMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase();
  }

  getDay(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  getFormattedDateRange(startDate: string, endDate: string): string {
    if (!endDate) return this.formatDate(startDate);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getTime() === end.getTime()) {
      return this.formatDate(startDate);
    }
    
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }
}