import { ChangeDetectorRef, Component, EventEmitter, Output, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface LocationData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'address';
  displayName?: string;
  isApproximate?: boolean;
  locationKind?: 'exact_address' | 'approximate_street' | 'named_place' | 'gps';
}

interface GeocodingCandidate {
  id: string;
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  result_type: string;
  location_kind: 'exact_address' | 'approximate_street' | 'named_place';
  is_approximate: boolean;
  precision_message: string;
}

interface GeocodingResponse {
  ok: boolean;
  query?: string;
  candidates?: GeocodingCandidate[];
  // Compatibilidad temporal con la respuesta antigua de un único punto.
  latitude?: number;
  longitude?: number;
  display_name?: string;
  is_approximate?: boolean;
  precision_message?: string;
  error?: string;
}

interface GeocodingError {
  error?: string;
  message?: string;
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
  private cdr = inject(ChangeDetectorRef);

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
  candidatos: GeocodingCandidate[] = [];
  candidatoSeleccionadoId: string | null = null;
  consultaRealizada = false;

  loading = false;
  loadingType: 'gps' | 'address' | null = null;
  errorMessage = '';

  getCurrentLocation(): void {
    this.errorMessage = '';
    this.candidatos = [];
    this.consultaRealizada = false;
    this.candidatoSeleccionadoId = null;

    if (!navigator.geolocation) {
      this.errorMessage = 'Tu navegador no permite obtener la ubicación.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.loadingType = 'gps';
    this.cdr.markForCheck();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
          locationKind: 'gps',
        };

        this.loading = false;
        this.loadingType = null;
        console.log('[LOCATION] GPS obtenido:', location);
        this.locationSelected.emit(location);
        this.cdr.markForCheck();
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

        this.cdr.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  searchByAddress(): void {
    this.errorMessage = '';
    this.candidatos = [];
    this.candidatoSeleccionadoId = null;
    this.consultaRealizada = false;

    const municipio = this.municipio.trim();
    const consulta = this.direccion.trim();

    if (!municipio || consulta.length < 3) {
      this.errorMessage = 'Indica el municipio y escribe al menos 3 caracteres.';
      this.cdr.markForCheck();
      return;
    }

    const token = sessionStorage.getItem('access_token');
    if (!token) {
      this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      this.cdr.markForCheck();
      return;
    }

    const params = new HttpParams().set('municipio', municipio).set('direccion', consulta);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.loading = true;
    this.loadingType = 'address';
    this.cdr.markForCheck();

    this.http
      .get<GeocodingResponse>(`${this.apiUrl}/location/geocode`, { params, headers })
      .subscribe({
        next: (response) => {
          console.log('[GEOCODING] Respuesta del backend:', response);
          this.loading = false;
          this.loadingType = null;
          this.consultaRealizada = true;

          let candidates = Array.isArray(response?.candidates) ? response.candidates : [];

          // Compatibility fallback if a running backend still returns the old single point.
          if (
            candidates.length === 0 &&
            Number.isFinite(response?.latitude) &&
            Number.isFinite(response?.longitude) &&
            typeof response?.display_name === 'string'
          ) {
            candidates = [
              {
                id: `legacy:${response.latitude}:${response.longitude}`,
                name: response.display_name.split(',')[0] || 'Ubicación encontrada',
                display_name: response.display_name,
                latitude: Number(response.latitude),
                longitude: Number(response.longitude),
                result_type: 'Ubicación',
                location_kind: response.is_approximate ? 'approximate_street' : 'named_place',
                is_approximate: response.is_approximate === true,
                precision_message:
                  response.precision_message || 'Comprueba que esta sea la ubicación correcta.',
              },
            ];
          }

          this.candidatos = candidates.filter(
            (candidate) =>
              candidate &&
              typeof candidate.id === 'string' &&
              typeof candidate.display_name === 'string' &&
              Number.isFinite(candidate.latitude) &&
              Number.isFinite(candidate.longitude),
          );

          if (this.candidatos.length === 0) {
            this.errorMessage =
              response?.error ||
              'El mapa no devolvió ubicaciones que podamos mostrar. Prueba con otra búsqueda o usa el GPS.';
          }

          this.cdr.markForCheck();
        },
        error: (error: { status?: number; error?: GeocodingError }) => {
          this.loading = false;
          this.loadingType = null;
          this.consultaRealizada = true;
          this.candidatos = [];

          if (error.status === 404) {
            this.errorMessage =
              error.error?.error ||
              'No encontramos coincidencias en ese municipio. Prueba con el nombre completo o usa el GPS.';
          } else if (error.status === 401 || error.status === 422) {
            this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          } else {
            this.errorMessage =
              error.error?.error ||
              error.error?.message ||
              'No fue posible buscar la ubicación. Inténtalo nuevamente.';
          }

          console.error('[GEOCODING] Error:', error);
          this.cdr.markForCheck();
        },
      });
  }

  usarUbicacion(candidato: GeocodingCandidate): void {
    if (
      !candidato ||
      !Number.isFinite(candidato.latitude) ||
      !Number.isFinite(candidato.longitude)
    ) {
      this.errorMessage = 'La ubicación elegida no contiene coordenadas válidas.';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.candidatoSeleccionadoId = candidato.id;

    const location: LocationData = {
      latitude: candidato.latitude,
      longitude: candidato.longitude,
      source: 'address',
      displayName: candidato.display_name,
      isApproximate: candidato.is_approximate,
      locationKind: candidato.location_kind,
    };

    console.log('[LOCATION] Candidato elegido por el usuario:', location);
    this.locationSelected.emit(location);
    this.cdr.markForCheck();
  }
}
