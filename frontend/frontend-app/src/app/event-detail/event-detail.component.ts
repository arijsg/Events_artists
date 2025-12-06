import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
    RouterLink,
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
    MatTooltipModule,
    MatAutocompleteModule,
    MatOptionModule
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
  
  // Gestion des artistes
  showAddArtistForm = false;
  artistControl = new FormControl('');
  filteredArtists: Artist[] = [];
  selectedArtist: Artist | null = null;
  allArtists: Artist[] = [];

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

    // Charger tous les artistes
    this.loadArtists();

    // Filtrer les artistes selon la saisie
    this.artistControl.valueChanges.subscribe(value => {
      this.filteredArtists = this.allArtists.filter(a =>
        a.label.toLowerCase().includes((value || '').toLowerCase())
      );
    });
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

  // Charger tous les artistes pour l'autocomplete
  loadArtists() {
    this.http.get<any>(`http://localhost:8080/artists?size=100`).subscribe({
      next: (response) => {
        // Gérer la réponse paginée ou directe
        this.allArtists = response.content || response;
        this.filteredArtists = this.allArtists;
        console.log('Artistes chargés:', this.allArtists.length);
      },
      error: (err) => {
        console.error('Erreur chargement artistes:', err);
        this.showNotification('Impossible de charger les artistes', 'error');
      }
    });
  }

  // Charger l'événement
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
        console.log('Événement chargé:', event);
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

  // Gestion des artistes - OUVRIR FORMULAIRE
  openAddArtistForm() {
    console.log('=== Ouverture formulaire ajout artiste ===');
    console.log('Artistes disponibles:', this.allArtists.length);
    console.log('AVANT - showAddArtistForm:', this.showAddArtistForm);
    this.showAddArtistForm = true;
    console.log('APRÈS - showAddArtistForm:', this.showAddArtistForm);
    
    // Vérifier l'état après un court délai
    setTimeout(() => {
      console.log('VÉRIFICATION - showAddArtistForm est maintenant:', this.showAddArtistForm);
      console.log('Le formulaire DEVRAIT être visible. Si ce n\'est pas le cas, il y a un problème Angular.');
    }, 100);
  }

  // Gestion des artistes - ANNULER
  cancelAddArtist() {
    console.log('=== Annulation ajout artiste ===');
    this.showAddArtistForm = false;
    this.selectedArtist = null;
    this.artistControl.setValue('');
  }

  // Gestion des artistes - SÉLECTION
  onArtistSelected(event: any) {
    const label = event.option.value;
    this.selectedArtist = this.allArtists.find(a => a.label === label) || null;
    console.log('=== Artiste sélectionné ===');
    console.log('Label recherché:', label);
    console.log('Artiste trouvé:', this.selectedArtist);
    console.log('Tous les artistes:', this.allArtists);
  }

  // Gestion des artistes - AJOUTER
  addArtist() {
    console.log('🚀 === DÉBUT ADDARTIST ===');
    
    if (!this.event || !this.selectedArtist) {
      console.log('❌ Pas d\'événement ou d\'artiste sélectionné');
      this.showNotification('Veuillez sélectionner un artiste', 'error');
      return;
    }

    // Vérifier que l'artiste n'est pas déjà dans la liste
    const artistExists = this.event.artists.some(a => a.id === this.selectedArtist!.id);
    if (artistExists) {
      console.log('❌ Artiste déjà présent');
      this.showNotification('Cet artiste participe déjà à l\'événement', 'error');
      return;
    }

    console.log('=== AJOUT ARTISTE VIA API DÉDIÉE ===');
    console.log('Event ID:', this.event.id);
    console.log('Artist ID:', this.selectedArtist.id);
    console.log('URL:', `http://localhost:8080/events/${this.event.id}/artists/${this.selectedArtist.id}`);

    // Utiliser la route POST dédiée
    this.http.post(`http://localhost:8080/events/${this.event.id}/artists/${this.selectedArtist.id}`, {})
      .subscribe({
        next: () => {
          console.log('=== SUCCÈS ===');
          console.log('Artiste ajouté avec succès via l\'API');
          
          // Ajouter l'artiste localement pour mise à jour immédiate
          this.event!.artists.push({
            id: this.selectedArtist!.id,
            label: this.selectedArtist!.label
          });
          
          this.showNotification('Artiste ajouté avec succès !', 'success');
          this.cancelAddArtist();
        },
        error: (err) => {
          console.error('=== ERREUR SERVEUR ===');
          console.error('Status:', err.status);
          console.error('Message:', err.message);
          console.error('Détails:', err.error);
          this.showNotification('Erreur lors de l\'ajout de l\'artiste', 'error');
        }
      });
  }

  // Gestion des artistes - RETIRER
  removeArtist(artistId: string) {
    if (this.event && confirm('Voulez-vous vraiment retirer cet artiste de l\'événement ?')) {
      console.log('=== RETRAIT ARTISTE VIA API DÉDIÉE ===');
      console.log('Event ID:', this.event.id);
      console.log('Artist ID:', artistId);
      
      // Utiliser la route DELETE dédiée
      this.http.delete(`http://localhost:8080/events/${this.event.id}/artists/${artistId}`)
        .subscribe({
          next: () => {
            console.log('=== SUCCÈS ===');
            console.log('Artiste retiré avec succès via l\'API');
            
            // Retirer l'artiste localement pour mise à jour immédiate
            this.event!.artists = this.event!.artists.filter(a => a.id !== artistId);
            
            this.showNotification('Artiste retiré avec succès', 'success');
          },
          error: (error) => {
            console.error('=== ERREUR ===', error);
            this.showNotification('Erreur lors du retrait de l\'artiste', 'error');
          }
        });
    }
  }

  // Supprimer l'événement
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