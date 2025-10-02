//jsons que representan los detalles de un trámite
export interface DetallesTramite {
  tramite: {
    idTramite: number;
  };
  tipoProceso: string;
  detalles: string;
  nombreArchivo: string;
  urlArchivo: string;
}   