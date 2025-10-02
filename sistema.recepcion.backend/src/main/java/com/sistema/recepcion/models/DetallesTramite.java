package com.sistema.recepcion.models;

import jakarta.persistence.*;

import java.util.Date;
//los modelos son las tablas de la base de datos, como uso jpa se generan automaticamente en base a los modelos de abajo
//en la parte superior esta el nombre de tabla y el morado o el que se encuentra al lado del tipo de variable el nombre que se usara en la logica
@Entity
public class DetallesTramite {

    //id auto generado
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //relacion con la tabla tramites, el modelo esta en la misma carpeta
    @ManyToOne
    //nombre de tabla en la base de datos
    @JoinColumn(name = "id_tramite", nullable = false)
    //nombre de la variable tramite
    private Tramite tramite;

    //igual para los demas datos
    @Column(name = "fecha_proceso", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaProceso;

    @Column(name = "tipo_proceso", length = 50)
    private String tipoProceso;

    @Column(name = "detalles", columnDefinition = "TEXT")
    private String detalles;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "url_archivo")
    private String urlArchivo;

    //getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Tramite getTramite() {
        return tramite;
    }

    public void setTramite(Tramite tramite) {
        this.tramite = tramite;
    }

    public Date getFechaProceso() {
        return fechaProceso;
    }

    public void setFechaProceso(Date fechaProceso) {
        this.fechaProceso = fechaProceso;
    }

    public String getTipoProceso() {
        return tipoProceso;
    }

    public void setTipoProceso(String tipoProceso) {
        this.tipoProceso = tipoProceso;
    }

    public String getDetalles() {
        return detalles;
    }

    public void setDetalles(String detalles) {
        this.detalles = detalles;
    }

    public String getNombreArchivo() {
        return nombreArchivo;
    }

    public void setNombreArchivo(String nombreArchivo) {
        this.nombreArchivo = nombreArchivo;
    }

    public String getUrlArchivo() {
        return urlArchivo;
    }

    public void setUrlArchivo(String urlArchivo) {
        this.urlArchivo = urlArchivo;
    }
}
