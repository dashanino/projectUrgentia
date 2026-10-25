import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PretriageResponse {
  message: string;
  id_user: number;
  id_pretriage: number;
  access_token: string;
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

  private apiUrl = 'http://127.0.0.1:5001/api';

  iniciarPretriage(): Observable<PretriageResponse> {
    return this.http.post<PretriageResponse>(`${this.apiUrl}/pretriage`, {});
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

guardarSintomas(
  idPretriage: number,
  idsSintomas: number[],
  token: string
): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/pretriage/${idPretriage}/sintomas`,
    {
      ids_sintomas: idsSintomas
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

generarPreguntaIA(
  idPretriage: number,
  token: string
): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/pretriage-agent/pregunta`,
    {
      id_pretriage: idPretriage
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

guardarRespuestaIA(
  idPretriage: number,
  idPregunta: number,
  respuesta: string,
  token: string
): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/pretriage-agent/respuesta`,
    {
      id_pretriage: idPretriage,
      id_pregunta: idPregunta,
      respuesta: respuesta
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

evaluarConIA(
  idPretriage: number,
  token: string
): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/pretriage-agent/evaluate`,
    {
      id_pretriage: idPretriage
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}


}
