import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BulkProgress {
  status: string;
  current: number;
  total: number;
  row: number | null;
  percentage: number;
}

export interface BulkProgressResponse {
  ok: boolean;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress: BulkProgress;
  statistics: {
    procesados: number;
    clasificados: number;
    revision_clinica: number;
    errores: number;
  } | null;
  error: string | null;
}

export interface BulkResultResponse extends HttpResponse<Blob> {}

@Injectable({
  providedIn: 'root',
})
export class BulkPretriageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:3000/api';

  iniciarEvaluacionExcel(file: File, token: string): Observable<{ ok: boolean; job_id: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<{ ok: boolean; job_id: string }>(
      `${this.apiUrl}/pretriage-agent/admin/evaluate-excel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  consultarProgreso(jobId: string, token: string): Observable<BulkProgressResponse> {
    return this.http.get<BulkProgressResponse>(
      `${this.apiUrl}/pretriage-agent/admin/evaluate-excel/${jobId}/progress`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  descargarResultado(jobId: string, token: string): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/pretriage-agent/admin/evaluate-excel/${jobId}/result`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        observe: 'response',
        responseType: 'blob',
      },
    );
  }
}
