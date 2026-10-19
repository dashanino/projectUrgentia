import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  document_number: string;
  first_names: string;
  last_names: string;
  email: string;
  phone: string;
  birth_date: string;
  id_eps: number;
  sex : string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://127.0.0.1:3000/api/auth';

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );
  }

  login(data: {
    document_number: string;
    password: string;
  }): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/login`,
      data
    );
  }
}