import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { TramiteDTO } from '../models/TramiteDTO';
import { TramiteModel } from '../models/Tramite';

@Injectable({
  providedIn: 'root'
})
export class TramiteService {
  private apiUrl = environment.apiUrl + '/tramites';

  constructor(private http: HttpClient) { }

  registrarTramite(tramiteDTO: TramiteDTO): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/registrar`,
      tramiteDTO,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  finalizarTramite(idTramite: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/finalizar`,
      idTramite,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  listarTramitesPorDni(dni: string): Observable<TramiteModel[]> {
    const params = new HttpParams().set('dni', dni);
    return this.http.post<TramiteModel[]>(
      `${this.apiUrl}/dni`,
      null,
      { params }
    );
  }
}