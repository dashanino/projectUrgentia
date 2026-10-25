import { Component, EventEmitter, Output, inject } from '@angular/core';

import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { FormsModule } from '@angular/forms';

export interface LocationData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'address';
}

interface GeocodingResponse {
  ok: boolean;
  latitude: number;
  longitude: number;
  display_name: string;
}

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './location.html',
  styleUrl: './location.scss',
})
export class Location {
  private http = inject(HttpClient);
  municipiosDisponibles: string[] = [
    'Medellín',
    'Envigado',
    'Bello',
    'Itagüí',
    'Sabaneta',
    'La Estrella',
    'Caldas',
  ];

  private apiUrl = 'http://127.0.0.1:3000/api';

  @Output() locationSelected = new EventEmitter<LocationData>();

  municipio = '';
  direccion = '';

  loading = false;
  loadingType: 'gps' | 'address' | null = null;
  errorMessage = '';

  getCurrentLocation(): void {
    this.errorMessage = '';

    if (!navigator.geolocation) {
      this.errorMessage = 'Tu navegador no permite obtener la ubicación.';
      return;
    }

    this.loading = true;
    this.loadingType = 'gps';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
        };

        this.loading = false;
        this.loadingType = null;

        console.log('Ubicación GPS obtenida:', location);
        this.locationSelected.emit(location);
      },

      (error) => {
        this.loading = false;
        this.loadingType = null;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.errorMessage = 'No permitiste el acceso a tu ubicación.';
            break;

          case error.POSITION_UNAVAILABLE:
            this.errorMessage = 'No fue posible determinar tu ubicación.';
            break;

          case error.TIMEOUT:
            this.errorMessage = 'La solicitud de ubicación tardó demasiado.';
            break;

          default:
            this.errorMessage = 'No fue posible obtener tu ubicación.';
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  searchByAddress(): void {
    this.errorMessage = '';

    const municipio = this.municipio.trim();
    const direccion = this.direccion.trim();

    if (!municipio || !direccion) {
      this.errorMessage = 'Debes ingresar el municipio y la dirección.';
      return;
    }

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      return;
    }

    const params = new HttpParams().set('municipio', municipio).set('direccion', direccion);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.loading = true;
    this.loadingType = 'address';

    this.http
      .get<GeocodingResponse>(`${this.apiUrl}/location/geocode`, { params, headers })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.loadingType = null;

          const location: LocationData = {
            latitude: response.latitude,
            longitude: response.longitude,
            source: 'address',
          };

          console.log('Ubicación por dirección:', {
            ...location,
            display_name: response.display_name,
          });

          this.locationSelected.emit(location);
        },

        error: (error) => {
          this.loading = false;
          this.loadingType = null;

          if (error.status === 404) {
            this.errorMessage = 'No encontramos esa dirección. Verifica los datos ingresados.';
          } else if (error.status === 401 || error.status === 422) {
            this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          } else {
            this.errorMessage =
              error.error?.error ?? 'No fue posible buscar esa dirección. Inténtalo nuevamente.';
          }

          console.error('Error al geocodificar dirección:', error);
        },
      });
  }
}
