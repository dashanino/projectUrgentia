import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PretriageResponse {
  message: string;
  id_user: number;
  id_pretriage: number;
  access_token: string;
}
export interface PretriageRegistradoResponse {
  message: string;
  id_pretriage: number;
  id_poblacion: number;
  poblacion: string;
  edad: number;
  antecedentes_precargados: number;
  antecedentes_completados: boolean;
  requiere_confirmacion_antecedentes: boolean;
  requiere_confirmacion_poblacion_especial: boolean;
}

export interface Sintoma {
  id: number;
  nombre: string;
  id_bandera: number;
}

export interface SintomasResponse {
  ok: boolean;
  sintomas: Sintoma[];
}

@Injectable({
  providedIn: 'root',
})
export class EmergencyService {
  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:3000/api';

  iniciarPretriage(): Observable<PretriageResponse> {
    return this.http.post<PretriageResponse>(`${this.apiUrl}/pretriage`, {});
  }
  iniciarPretriageRegistrado(
    token: string
  ): Observable<PretriageRegistradoResponse> {
    return this.http.post<PretriageRegistradoResponse>(
      `${this.apiUrl}/pretriage/registrado`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
  }
  confirmarClinicaRegistrado(
    idPretriage: number,
    token: string,
    accidente: boolean,
    embarazo: boolean | null,
    antecedentesActualizados: boolean
  ): Observable<{
    ok: boolean;
    message: string;
    id_pretriage: number;
    id_poblacion: number;
    poblacion: string;
    antecedentes_actualizados: boolean;
  }> {
    return this.http.post<{
      ok: boolean;
      message: string;
      id_pretriage: number;
      id_poblacion: number;
      poblacion: string;
      antecedentes_actualizados: boolean;
    }>(
      `${this.apiUrl}/pretriage/${idPretriage}/confirmacion-clinica`,
      {
        accidente,
        embarazo,
        antecedentes_actualizados: antecedentesActualizados,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  guardarAntecedentes(
    idPretriage: number,
    idsAntecedentes: number[],
    token: string,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/antecedentes`,
      {
        id_antecedentes: idsAntecedentes,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  guardarPoblacion(idPretriage: number, idPoblacion: number, token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/poblacion`,
      {
        id_poblacion: idPoblacion,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  guardarBanderasRojas(idPretriage: number, idsBanderas: number[], token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/banderas-rojas`,
      {
        id_banderas: idsBanderas,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  evaluarTriage(idPretriage: number, token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/evaluar-triage`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  generarPreguntasAdicionales(idPretriage: number, token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/preguntas-adicionales`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  obtenerSintomasPorRedFlag(idRedFlag: number): Observable<SintomasResponse> {
    return this.http.get<SintomasResponse>(`${this.apiUrl}/sintomas/${idRedFlag}`);
  }

  guardarSintomas(idPretriage: number, idsSintomas: number[], token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage/${idPretriage}/sintomas`,
      {
        ids_sintomas: idsSintomas,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  generarPreguntaIA(idPretriage: number, token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage-agent/pregunta`,
      {
        id_pretriage: idPretriage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  guardarRespuestaIA(
    idPretriage: number,
    idPregunta: number,
    respuesta: string,
    token: string,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage-agent/respuesta`,
      {
        id_pretriage: idPretriage,
        id_pregunta: idPregunta,
        respuesta: respuesta,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  evaluarConIA(idPretriage: number, token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/pretriage-agent/evaluate`,
      {
        id_pretriage: idPretriage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }
  clasificarTipoAtencion(
    idPretriage: number,
    token: string,
  ): Observable<{
    ok: boolean;
    id_pretriage: number;
    tipo_atencion_urgencias: string;
  }> {
    return this.http.post<{
      ok: boolean;
      id_pretriage: number;
      tipo_atencion_urgencias: string;
    }>(
      `${this.apiUrl}/pretriage-agent/tipo-atencion`,
      { id_pretriage: idPretriage },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }
}
