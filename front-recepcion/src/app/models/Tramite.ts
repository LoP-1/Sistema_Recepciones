export interface Tramite {
  idTramite: number;
  persona: {
    idPersona: number;
    nombre: string;
    dni: string;
    telefono?: string;
  };
  encargado?: {
    idEncargado: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  nroExpediente: string;
  fechaInicio: string;
  fechaFin: string | null;
  descripcion: string;
  estado: boolean; 
  fechas?: string;
}