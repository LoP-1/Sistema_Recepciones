import { Tramite } from '../models/tramite';

export interface HistorialProceso {
  id: number;
  tramite: Tramite;
  fechaProceso: string;
  tipoProceso: string;
  detalles: string;
    nombreArchivo?: string;
  urlArchivo?: string;
}
