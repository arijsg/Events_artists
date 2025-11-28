import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArtistPageResponse, Artist } from '../models/artist.model';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Appel conforme à ta doc Swagger (filterParams + pageable)
  getArtists(label: string = '', page: number = 0, size: number = 10): Observable<ArtistPageResponse> {
  let params = new HttpParams()
    .set('label', label)           
    .set('page', String(page))     
    .set('size', String(size))    
    .set('sort', '');  
                

  return this.http.get<ArtistPageResponse>(`${this.apiUrl}/artists`, { params });
}
  getAllArtists(): Observable<Artist[]> {
    let params = new HttpParams()
      .set('label', '')
      .set('page', '0')
      .set('size', '10000')
      .set('sort', '');

    return this.http.get<ArtistPageResponse>(`${this.apiUrl}/artists`, { params }).pipe(
      map(response => response.content || [])
    );
  }

  getArtistById(id: string) {
    return this.http.get<Artist>(`${this.apiUrl}/artists/${id}`);
  }

  updateArtist(id: string, payload: { label: string }) {
    return this.http.put(`${this.apiUrl}/artists/${id}`, payload);
  }

  deleteArtist(id: string) {
    return this.http.delete(`${this.apiUrl}/artists/${id}`);
  }

createArtist(artist: { label: string }) {
  return this.http.post<Artist>(`${this.apiUrl}/artists`, artist);
}
}
