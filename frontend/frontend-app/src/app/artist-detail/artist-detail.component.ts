import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Models
import { Artist } from '../models/artist.model';
import { Event } from '../models/artist.model';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,

    // Material
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.scss']
})
export class ArtistDetailComponent implements OnInit {

  artist: Artist | null = null;
  events: Event[] = [];

  isLoading = false;
  isSaving = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadArtist(id);
  }

  // Load artist info + events
  loadArtist(id: string) {
    this.isLoading = true;
    this.errorMessage = null;

    // 1 — Get artist info
    this.http.get<Artist>(`http://localhost:8080/artists/${id}`).subscribe({
      next: (artist) => {
        this.artist = artist;

        // 2 — Get events for this artist
        this.http.get<Event[]>(`http://localhost:8080/artists/${id}/events`)
          .subscribe({
            next: (events) => {
              this.events = events;
              this.isLoading = false;
            },
            error: () => {
              this.errorMessage = "Impossible de charger les événements.";
              this.isLoading = false;
            }
          });
      },
      error: () => {
        this.errorMessage = "Artiste introuvable (404).";
        this.isLoading = false;
      }
    });
  }

  // Save new name using PUT /artists/{id}
  saveArtist() {
    if (!this.artist) return;
    if (this.artist.label.trim().length < 3) {
      this.snackBar.open("Le nom doit contenir au moins 3 caractères.", "Fermer", {
        duration: 3000
      });
      return;
    }

    this.isSaving = true;

    this.http.put(`http://localhost:8080/artists/${this.artist.id}`, {
      label: this.artist.label
    }).subscribe({
      next: () => {
        this.snackBar.open("Artiste mis à jour avec succès.", "Fermer", { duration: 3000 });
        this.isSaving = false;
      },
      error: () => {
        this.snackBar.open("Erreur lors de la mise à jour.", "Fermer", { duration: 3000 });
        this.isSaving = false;
      }
    });
  }

  
  deleteArtist() {
    if (!this.artist) return;

    // Confirmation avant suppression
    const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer l'artiste "${this.artist.label}" ?`);
    
    if (!confirmed) return;

    this.isSaving = true;

    this.http.delete(`http://localhost:8080/artists/${this.artist.id}`).subscribe({
      next: () => {
        this.snackBar.open("Artiste supprimé avec succès.", "Fermer", { duration: 3000 });
        this.isSaving = false;
        
        // Redirection vers la liste des artistes
        setTimeout(() => {
          this.router.navigate(['/artists']);
        }, 1000);
      },
      error: (err) => {
        let errorMsg = "Erreur lors de la suppression.";
        if (err.status === 404) {
          errorMsg = "Artiste introuvable.";
        } else if (err.status === 500) {
          errorMsg = "Erreur serveur lors de la suppression.";
        }
        this.snackBar.open(errorMsg, "Fermer", { duration: 3000 });
        this.isSaving = false;
      }
    });
  }
}