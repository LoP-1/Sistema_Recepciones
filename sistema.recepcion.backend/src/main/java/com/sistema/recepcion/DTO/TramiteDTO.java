package com.sistema.recepcion.DTO;

//igual que los otros dto, esta mas completo porque tiene mas datos :p
public class TramiteDTO {
    private String nombre;
    private String dni;
    private String telefono;
    private String expediente;
    private String detalles;
    private String dniEncargado;
    private String fechasPedidas;

    //getters y setters


    public String getFechasPedidas() {
        return fechasPedidas;
    }

    public void setFechasPedidas(String fechasPedidas) {
        this.fechasPedidas = fechasPedidas;
    }

    public String getDniEncargado() {
        return dniEncargado;
    }

    public void setDniEncargado(String dniEncargado) {
        this.dniEncargado = dniEncargado;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDetalles() {
        return detalles;
    }

    public void setDetalles(String detalles) {
        this.detalles = detalles;
    }

    public String getExpediente() {
        return expediente;
    }

    public void setExpediente(String expediente) {
        this.expediente = expediente;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }
}
