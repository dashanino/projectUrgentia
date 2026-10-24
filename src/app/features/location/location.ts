import { Component, EventEmitter, Output } from '@angular/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'address';
}

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [],
  templateUrl: './location.html',
  styleUrl: './location.scss',
})
export class Location {
  @Output() locationSelected = new EventEmitter<LocationData>();

  loading = false;
  errorMessage = '';

  getCurrentLocation(): void {
    this.loading = true;
    this.errorMessage = '';

    if (!navigator.geolocation) {
      this.loading = false;
      this.errorMessage = 'Tu navegador no permite obtener la ubicación.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
        };

        console.log('Ubicación obtenida:', location);

        this.loading = false;

        this.locationSelected.emit(location);
      },

      (error) => {
        this.loading = false;

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
    );
  }
}
