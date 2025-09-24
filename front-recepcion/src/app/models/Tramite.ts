import { Encargado } from './Encargado';
import { Persona } from './Persona';

export interface TramiteModel {
  idTramite: number;
  persona: Persona;
  encargado: Encargado;
  nroExpediente: string;
  fechaInicio: string; 
  fechaFin?: string | null;
  descripcion: string;
  estado: boolean;
}