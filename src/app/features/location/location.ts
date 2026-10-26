import { ChangeDetectorRef, Component, EventEmitter, Output, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export interface LocationData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'address';
  displayName?: string;
  isApproximate?: boolean;
}

interface GeocodingResponse {
  ok: boolean;
  latitude: number;
  longitude: number;
  display_name: string;
  is_approximate?: boolean;
  precision_message?: string;
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
  loading = false;
  loadingType: 'gps' | 'address' | null = null;
  errorMessage = '';
  ubicacionPendiente: LocationData | null = null;
  mensajePrecision = '';
  ubicacionConfirmada = '';

  limpiarUbicacionPendiente(): void {
    this.ubicacionPendiente = null;
    this.mensajePrecision = '';
    this.ubicacionConfirmada = '';
    this.errorMessage = '';
  }

  getCurrentLocation(): void {
    this.errorMessage = '';
    this.ubicacionPendiente = null;
    this.mensajePrecision = '';
    this.ubicacionConfirmada = '';

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
          isApproximate: false,
        };
        this.loading = false;
        this.loadingType = null;
        this.ubicacionConfirmada = 'Ubicación obtenida mediante GPS.';
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
        this.cdr.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  searchByAddress(): void {
    this.errorMessage = '';
    this.ubicacionPendiente = null;
    this.mensajePrecision = '';
    this.ubicacionConfirmada = '';

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
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.loading = true;
    this.loadingType = 'address';

    this.http
      .get<GeocodingResponse>(`${this.apiUrl}/location/geocode`, { params, headers })
      .subscribe({
        next: (response) => {
          console.log('[GEOCODING] Respuesta del backend:', response);

          this.loading = false;
          this.loadingType = null;

          if (
            !response?.ok ||
            !Number.isFinite(response.latitude) ||
            !Number.isFinite(response.longitude) ||
            typeof response.display_name !== 'string' ||
            !response.display_name.trim()
          ) {
            this.errorMessage =
              'El servicio de mapas no devolvió una ubicación verificable. Usa GPS o intenta otra dirección.';

            this.cdr.markForCheck();
            return;
          }

          const esAproximada = response.is_approximate === true;

          this.ubicacionPendiente = {
            latitude: response.latitude,
            longitude: response.longitude,
            source: 'address',
            displayName: response.display_name,
            isApproximate: esAproximada,
          };

          this.mensajePrecision =
            response.precision_message ||
            (esAproximada
              ? 'No se encontró el número exacto. El punto representa la vía y las distancias serán aproximadas.'
              : 'Se encontró una coincidencia con el número de dirección.');

          console.log('[GEOCODING] Ubicación pendiente de confirmación:', this.ubicacionPendiente);

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading = false;
          this.loadingType = null;
          if (error.status === 401) {
            this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
          } else if (error.status === 400) {
            this.errorMessage =
              error.error?.error || 'Revisa el formato de la dirección e inténtalo de nuevo.';
          } else if (error.status === 404) {
            this.errorMessage =
              error.error?.error ||
              'No encontramos la vía en el municipio indicado. Comprueba los datos o utiliza GPS.';
          } else if (error.status === 502) {
            this.errorMessage =
              error.error?.error ||
              'El servicio de mapas no está disponible ahora. Inténtalo de nuevo o usa GPS.';
          } else {
            this.errorMessage =
              error.error?.error || 'No fue posible verificar la dirección. Inténtalo nuevamente.';
          }
          this.cdr.markForCheck();
        },
      });
  }

  confirmarUbicacion(): void {
    if (!this.ubicacionPendiente) return;

    const ubicacion = this.ubicacionPendiente;
    this.ubicacionConfirmada = ubicacion.isApproximate
      ? `Ubicación aproximada seleccionada: ${ubicacion.displayName}. Las distancias son estimadas desde la vía, no desde el inmueble exacto.`
      : `Ubicación seleccionada: ${ubicacion.displayName}`;
    this.ubicacionPendiente = null;
    this.mensajePrecision = '';
    this.errorMessage = '';
    this.locationSelected.emit(ubicacion);
  }

  rechazarUbicacion(): void {
    this.ubicacionPendiente = null;
    this.mensajePrecision = '';
    this.errorMessage = 'No utilizaremos ese punto. Corrige la dirección o usa tu ubicación GPS.';
  }
}
