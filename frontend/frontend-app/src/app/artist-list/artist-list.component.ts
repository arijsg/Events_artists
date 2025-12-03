import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';

// Material modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ArtistService } from '../services/artist.service';
import { Artist } from '../models/artist.model';

@Component({
  selector: 'app-artist-list',
  standalone: true,
  encapsulation: ViewEncapsulation.None,

  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './artist-list.component.html',
  styleUrls: ['./artist-list.component.scss']
})
export class ArtistListComponent implements OnInit {

  artists: Artist[] = [];           // Artistes affichés sur la page
  allArtists: Artist[] = [];        // TOUS les artistes (pour la recherche)
  filteredArtists: Artist[] = [];   // Résultats de recherche

  currentPage = 0;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;

  isLoading = false;
  isSearching = false;  // Mode recherche activé ou non
  errorMessage: string | null = null;
  searchQuery = '';

  constructor(
    private artistService: ArtistService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAllArtists();  // Charge TOUS les artistes pour la recherche
    this.fetchArtists();    // Charge la première page
  }

  /** 
   * Charger TOUS les artistes (pour la recherche globale)
   * Cette méthode s'exécute une seule fois au démarrage
   */
  loadAllArtists(): void {
    this.artistService.getAllArtists().subscribe({
      next: (artists) => {
        this.allArtists = artists;
        console.log(`${artists.length} artistes chargés pour la recherche globale`);
      },
      error: (err) => {
        console.error('Erreur lors du chargement de tous les artistes', err);
      }
    });
  }

  /** 
   * Charger les artistes paginés (page par page)
   */
  fetchArtists(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.isSearching = false;

    this.artistService
      .getArtists('', this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.artists = response.content || [];
          this.totalPages = response.totalPages ?? 1;
          this.totalElements = response.totalElements ?? 0;
          this.currentPage = response.number ?? this.currentPage;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = `Erreur serveur: ${error.status ?? ''} ${error.statusText ?? ''}`;

          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /** 
   * Gestion de la pagination
   */
  handlePageEvent(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.fetchArtists();
  }

  /** 
   * Recherche dans TOUS les artistes (pas seulement la page courante)
   */
  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();

    // Si la recherche est vide, retour à la pagination normale
    if (!query) {
      this.isSearching = false;
      this.fetchArtists();
      return;
    }

    // Active le mode recherche
    this.isSearching = true;

    // Filtre dans TOUS les artistes chargés
    this.filteredArtists = this.allArtists.filter(artist =>
      artist.label.toLowerCase().includes(query)
    );

    // Affiche les résultats de recherche
    this.artists = this.filteredArtists;

    // Message si aucun résultat
    if (this.filteredArtists.length === 0) {
      this.snackBar.open(`Aucun artiste trouvé pour "${this.searchQuery}"`, 'Fermer', {
        duration: 3000
      });
    } else {
      this.snackBar.open(`${this.filteredArtists.length} artiste(s) trouvé(s)`, 'Fermer', {
        duration: 2000
      });
    }
  }

  /** 
   * Effacer la recherche et revenir à la pagination
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = false;
    this.filteredArtists = [];
    this.currentPage = 0;  // Retour à la page 1
    this.fetchArtists();
  }

  /** 
   * Création d'un artiste
   */
  openCreateDialog(): void {
    const name = prompt("Nom du nouvel artiste :");

    if (!name || name.trim().length < 3) {
      this.snackBar.open("Nom invalide (minimum 3 caractères).", "Fermer", {
        duration: 3000
      });
      return;
    }

    const newArtist = { label: name.trim() };

    this.artistService.createArtist(newArtist).subscribe({
      next: () => {
        this.snackBar.open("Artiste créé avec succès !", "Fermer", { duration: 3000 });
        this.loadAllArtists();  // Recharge TOUS les artistes
        this.fetchArtists();     // Recharge la liste paginée
      },
      error: () => {
        this.snackBar.open("Erreur lors de la création.", "Fermer", { duration: 3000 });
      }
    });
  }
}