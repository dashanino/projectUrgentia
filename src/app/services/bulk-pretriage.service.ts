import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BulkPretriageService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:3000/api';

  evaluarExcel(file: File, token: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(
      `${this.apiUrl}/pretriage-agent/admin/evaluate-excel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
        observe: 'body',
      },
    );
  }
}
