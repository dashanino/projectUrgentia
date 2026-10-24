import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Institution {
  id: number;
  name: string;
  type: string;
  level: number;
  municipality: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
}

export interface InstitutionsResponse {
  ok: boolean;
  prioridad: string;
  institutions: Institution[];
}

@Injectable({
  providedIn: 'root'
})
export class InstitutionsService {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:5000/api/institutions';

  getNearbyInstitutions(
    latitude: number,
    longitude: number,
    prioridad: string
  ): Observable<InstitutionsResponse> {

    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('prioridad', prioridad);

    return this.http.get<InstitutionsResponse>(
      `${this.apiUrl}/nearby`,
      { params }
    );
  }
}