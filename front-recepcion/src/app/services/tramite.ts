// Servicio central para registrar, finalizar y consultar trámites
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

  // Registra un nuevo trámite usando los datos del DTO
  registrarTramite(payload: TramiteDTO): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.base}/registrar`, payload);
  }

  // Marca un trámite como finalizado usando su ID
  finalizarTramite(id: number): Observable<MensajeDTO> {
    // El backend espera el número "plano" en body (JSON number)
    return this.http.post<MensajeDTO>(`${this.base}/finalizar`, id);
  }

  // Lista todos los trámites asociados al DNI dado
  listarPorDni(dni: string): Observable<Tramite[]> {
    const body: DniDTO = { dni };
    return this.http.post<Tramite[]>(`${this.base}/dni`, body);
  }

  // Agrega detalles a un trámite (seguimiento, adjunto, etc.)
  agregarDetalles(payload: DetallesTramite): Observable<MensajeDTO> {
    return this.http.post<MensajeDTO>(`${this.base}/detalles`, payload);
  }

  // Obtiene el historial completo de procesos para un trámite
  obtenerHistorial(idTramite: number): Observable<HistorialProceso[]> {
    return this.http.post<HistorialProceso[]>(`${this.base}/historial`, idTramite);
  }
}