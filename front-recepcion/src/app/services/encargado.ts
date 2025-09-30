import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Encargado } from '../models/encargado';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EncargadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/encargado`;

  registrar(encargado: Encargado): Observable<string> {
    return this.http.post(this.base + '/registrar', encargado, { responseType: 'text' });
  }

  login(dni: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.base + '/login', { dni, password });
  }
}