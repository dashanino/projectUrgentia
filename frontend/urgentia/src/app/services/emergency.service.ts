import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface EmergencyResponse {
  message: string;
  id_user: number;
  id_pretriage: number;
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyService {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:3000/api';

  iniciarEmergencia() {
    return this.http.post<EmergencyResponse>(
      `${this.apiUrl}/pretriage`,
      {}
    );
  }
}