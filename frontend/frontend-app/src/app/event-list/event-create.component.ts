import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Artist {
  id: string;
  label: string;
}

interface PageResponse {
  content: Artist[];
}

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {

  // Injection Angular
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  artists: Artist[] = [];
  isLoading = false;
  isSubmitting = false;

  eventForm: FormGroup = this.fb.group({
    label: ['', [Validators.required, Validators.minLength(3)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    artistIds: [[]]
  }, { validators: this.dateValidator });

  ngOnInit() {
    this.loadArtists();
  }

  // Validator pour vérifier que endDate > startDate
  dateValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end && new Date(end) < new Date(start)) {
      return { dateInvalid: true };
    }
    return null;
  }

  loadArtists() {
    this.isLoading = true;
    
    // Charger tous les artistes (avec pagination si nécessaire)
    this.http.get<PageResponse>('http://localhost:8080/artists?size=100').subscribe({
      next: (response) => {
        this.artists = response.content || response as any;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement artistes:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des artistes', 'Fermer', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
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

  async submit() {
    if (this.eventForm.invalid) {
      this.snackBar.open('Veuillez remplir correctement tous les champs obligatoires.', 'Fermer', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.eventForm.value;
      const selectedArtistIds = formValue.artistIds || [];

      // Préparer les artistes au format attendu
      const artistsData = selectedArtistIds.map((artistId: string) => {
        const artist = this.artists.find(a => a.id === artistId);
        return {
          id: artistId,
          label: artist?.label || ''
        };
      });

      // Préparer les données de l'événement
      const eventData = {
        label: formValue.label,
        startDate: this.formatDateForAPI(formValue.startDate),
        endDate: this.formatDateForAPI(formValue.endDate),
        artists: artistsData
      };

      console.log('Données envoyées:', eventData);

      // Créer l'événement
      this.http.post('http://localhost:8080/events', eventData).subscribe({
        next: (response) => {
          console.log('Événement créé:', response);
          this.isSubmitting = false;
          this.snackBar.open('Événement créé avec succès !', 'Fermer', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Rediriger vers la liste des événements
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 1000);
        },
        error: (error) => {
          console.error('Erreur création événement:', error);
          this.isSubmitting = false;
          
          let errorMessage = 'Erreur lors de la création de l\'événement';
          if (error.status === 400) {
            errorMessage = 'Données invalides. Vérifiez les dates et le nom.';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer.';
          }
          
          this.snackBar.open(errorMessage, 'Fermer', { 
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
      this.isSubmitting = false;
      this.snackBar.open('Une erreur est survenue', 'Fermer', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  goBack() {
    this.router.navigate(['/events']);
  }

  // Getters pour les erreurs
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