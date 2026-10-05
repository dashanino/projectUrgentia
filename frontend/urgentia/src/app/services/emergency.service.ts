import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PretriageResponse {
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

  iniciarPretriage(): Observable<PretriageResponse> {
    return this.http.post<PretriageResponse>(
      `${this.apiUrl}/pretriage`,
      {}
    );
  }
  guardarAntecedentes(
    idPretriage: number,
    idsAntecedentes: number[],
    token: string
  ): Observable<any> {
  
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/antecedentes`,
      {
        id_antecedentes: idsAntecedentes
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
  guardarPoblacion(
    idPretriage: number,
    idPoblacion: number,
    token: string
  ): Observable<any> {
  
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/poblacion`,
      {
        id_poblacion: idPoblacion
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
  guardarBanderasRojas(
    idPretriage: number,
    idsBanderas: number[],
    token: string
  ): Observable<any> {
  
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/banderas-rojas`,
      {
        id_banderas: idsBanderas
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
  evaluarTriaje(
    idPretriage: number,
    token: string
  ): Observable<any> {
  
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/evaluar-triage`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
}