import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Artist {
  id: string;
  label: string;
}

interface Event {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  artists: Artist[];
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event: Event | null = null;
  eventForm: FormGroup;
  isLoading = false;
  isEditing = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.fb.group({
      label: ['', [Validators.required, Validators.minLength(3)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    }, { validators: this.dateValidator });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
    }
  }

  // Validator personnalisé pour vérifier que endDate > startDate
  dateValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end && new Date(end) < new Date(start)) {
      return { dateInvalid: true };
    }
    return null;
  }

  loadEvent(id: string) {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<Event>(`http://localhost:8080/events/${id}`).subscribe({
      next: (event) => {
        this.event = event;
        this.eventForm.patchValue({
          label: event.label,
          startDate: event.startDate,
          endDate: event.endDate
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 404) {
          this.errorMessage = 'Événement non trouvé';
          this.showNotification('Événement non trouvé', 'error');
        } else if (error.status === 500) {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          this.showNotification('Erreur serveur', 'error');
        } else {
          this.errorMessage = 'Impossible de charger les détails de l\'événement';
          this.showNotification('Erreur de chargement', 'error');
        }
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.event) {
      // Réinitialiser le formulaire si on annule
      this.eventForm.patchValue({
        label: this.event.label,
        startDate: this.event.startDate,
        endDate: this.event.endDate
      });
    }
  }

  onSubmit() {
    if (this.eventForm.valid && this.event) {
      this.isLoading = true;
      
      // Convertir les dates au format YYYY-MM-DD
      const startDate = this.formatDateForAPI(this.eventForm.value.startDate);
      const endDate = this.formatDateForAPI(this.eventForm.value.endDate);

      const updatedEvent = {
        ...this.event,
        label: this.eventForm.value.label,
        startDate: startDate,
        endDate: endDate
      };

      this.http.put<Event>(`http://localhost:8080/events/${this.event.id}`, updatedEvent)
        .subscribe({
          next: (response) => {
            this.event = response;
            this.isEditing = false;
            this.isLoading = false;
            this.showNotification('Événement mis à jour avec succès !', 'success');
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur complète:', error);
            if (error.status === 400) {
              this.showNotification('Données invalides: ' + (error.error?.message || ''), 'error');
            } else if (error.status === 500) {
              this.showNotification('Erreur serveur lors de la mise à jour', 'error');
            } else {
              this.showNotification('Impossible de mettre à jour l\'événement', 'error');
            }
          }
        });
    }
  }

  // Convertir Date en string YYYY-MM-DD
  formatDateForAPI(date: any): string {
    if (typeof date === 'string') {
      return date;
    }
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return date;
  }

  removeArtist(artistId: string) {
    if (this.event && confirm('Voulez-vous vraiment retirer cet artiste de l\'événement ?')) {
      // Mettre à jour l'événement en retirant l'artiste
      const updatedEvent = {
        ...this.event,
        artists: this.event.artists.filter(a => a.id !== artistId)
      };

      this.http.put<Event>(`http://localhost:8080/events/${this.event.id}`, updatedEvent)
        .subscribe({
          next: (response) => {
            this.event = response;
            this.showNotification('Artiste retiré avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du retrait de l\'artiste', 'error');
          }
        });
    }
  }

  deleteEvent() {
    if (this.event && confirm('Voulez-vous vraiment supprimer cet événement ? Cette action est irréversible.')) {
      this.isLoading = true;
      
      this.http.delete(`http://localhost:8080/events/${this.event.id}`, { observe: 'response' })
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            console.log('Suppression réussie:', response);
            this.showNotification('Événement supprimé avec succès', 'success');
            setTimeout(() => {
              this.router.navigate(['/events']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Erreur de suppression:', error);
            if (error.status === 404) {
              this.showNotification('Événement non trouvé', 'error');
            } else if (error.status === 500) {
              this.showNotification('Erreur serveur lors de la suppression', 'error');
            } else {
              this.showNotification('Erreur lors de la suppression: ' + (error.error?.message || error.message), 'error');
            }
          }
        });
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar']
    });
  }

  // Getters pour les erreurs de formulaire
  get labelError(): string {
    const control = this.eventForm.get('label');
    if (control?.hasError('required')) {
      return 'Le nom est obligatoire';
    }
    if (control?.hasError('minlength')) {
      return 'Le nom doit comporter au moins 3 caractères';
    }
    return '';
  }

  get dateError(): string {
    if (this.eventForm.hasError('dateInvalid')) {
      return 'La date de fin doit être postérieure à la date de début';
    }
    return '';
  }
}