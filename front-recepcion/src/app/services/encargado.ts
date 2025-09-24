import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Encargado } from '../models/Encargado';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class EncargadoService {
  private apiUrl = environment.apiUrl + '/encargado';

  constructor(private http: HttpClient) {}

  registrarEncargado(encargado: Encargado): Observable<string> {
    return this.http.post<string>(
      `${this.apiUrl}/registrar`,
      encargado,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

}