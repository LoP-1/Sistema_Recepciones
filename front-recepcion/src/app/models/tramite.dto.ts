export interface TramiteDTO {
  nombre: string;
  dni: string;
  telefono: string;
  expediente: string;
  detalles: string;
  dniEncargado: string;
  fechasPedidas?: string;
  fechaInicio: Date;
}