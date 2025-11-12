package com.sistema.recepcion.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.util.Date;

public class FinalizarTramiteDTO {
    private Long id;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private Date fecha;

    public FinalizarTramiteDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getFecha() { return fecha; }
    public void setFecha(Date fecha) { this.fecha = fecha; }
}