import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Tramite } from '../models/tramite';
import { TramiteDTO } from '../models/tramite.dto';
import { MensajeDTO } from '../models/mensaje.dto';
import { DetallesTramite } from '../models/detalles-tramite';
import { DniDTO } from '../models/dni.dto';
import { Observable } from 'rxjs';
import { HistorialProceso } from '../models/historial';

@Injectable({ providedIn: 'root' })
export class TramiteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tramites`;

  registrarTramite(payload: TramiteDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.base}/registrar`, payload);
  }

  finalizarTramite(id: number): Observable<MensajeDTO> {
    // El backend espera el número "plano" en body (JSON number)
    return this.http.post<MensajeDTO>(`${this.base}/finalizar`, id);
  }

  listarPorDni(dni: string): Observable<Tramite[]> {
    const body: DniDTO = { dni };
    return this.http.post<Tramite[]>(`${this.base}/dni`, body);
  }

  agregarDetalles(payload: DetallesTramite): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.base}/detalles`, payload);
  }
  obtenerHistorial(idTramite: number): Observable<HistorialProceso[]> {
    return this.http.post<HistorialProceso[]>(`${this.base}/historial`, idTramite);
  }
}