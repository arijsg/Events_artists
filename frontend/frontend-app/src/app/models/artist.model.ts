// Interface pour un Événement (simplifié)
export interface Event {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

// Interface pour un Artiste
export interface Artist {
  id: string;
  label: string;
  events: Event[];
}

// Interface pour la réponse paginée de l'API
export interface ArtistPageResponse {
  content: Artist[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}