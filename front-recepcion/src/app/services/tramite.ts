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

export interface FinalizarTramiteDTO {
  id: number;
  fecha?: string;
}

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
  const payload: FinalizarTramiteDTO = {
    id,
    fecha: limaIsoNow(new Date())
  };
  return this.http.post<MensajeDTO>(`${this.base}/finalizar`, payload);
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

// helpers para obtener fecha/hora en zona America/Lima y armar ISO con offset "-05:00"

function pad(n: number, z = 2) {
  return String(Math.abs(Math.floor(n))).padStart(z, '0');
}

// devuelve ISO en zona America/Lima con offset fijo -05:00, por ejemplo:
// "2025-11-12T11:37:04.428-05:00"
function limaIsoNow(date = new Date()): string {
  // Obtiene partes en la zona America/Lima
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = dtf.formatToParts(date).reduce<Record<string,string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});

  const year = parts['year'];
  const month = parts['month'];
  const day = parts['day'];
  const hour = parts['hour'];
  const minute = parts['minute'];
  const second = parts['second'];
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  // Perú es UTC-5, offset fijo:
  const offset = '-05:00';

  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}${offset}`;
}