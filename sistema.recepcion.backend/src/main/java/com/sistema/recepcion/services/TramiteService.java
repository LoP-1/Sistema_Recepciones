package com.sistema.recepcion.services;

import com.sistema.recepcion.DTO.TramiteDTO;
import com.sistema.recepcion.models.DetallesTramite;
import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.models.Persona;
import com.sistema.recepcion.models.Tramite;
import com.sistema.recepcion.repositorys.DetallesTramiteRepository;
import com.sistema.recepcion.repositorys.EncargadoRepository;
import com.sistema.recepcion.repositorys.PersonaRepository;
import com.sistema.recepcion.repositorys.TramiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class TramiteService {

    @Value("${archivos.tramites.upload-dir}")
    private String uploadDir;

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private EncargadoRepository encargadoRepository;

    @Autowired
    private DetallesTramiteRepository detallesTramiteRepository;

    @Autowired
    private TramiteRepository tramiteRepository;

    public String iniciarTramite(TramiteDTO datosTramite) {
        // Buscar persona por DNI
        Persona persona = personaRepository.findByDni(datosTramite.getDni());
        if (persona == null) {
            persona = new Persona();
            persona.setDni(datosTramite.getDni());
            persona.setTelefono(datosTramite.getTelefono());
            persona.setNombre(datosTramite.getNombre());
            personaRepository.save(persona);
            System.out.println("Persona creada con exito");
        } else {
            persona.setTelefono(datosTramite.getTelefono());
            persona.setNombre(datosTramite.getNombre());
            personaRepository.save(persona);
            System.out.println("Persona actualizada con exito");
        }

        // Buscar encargado por DNI
        Optional<Encargado> optionalEncargado = encargadoRepository.findByDni(datosTramite.getDniEncargado());
        if (optionalEncargado.isEmpty()) {
            return "Encargado no encontrado";
        }
        Encargado encargado = optionalEncargado.get();

        // Crear y guardar el trámite
        Tramite tramite = new Tramite();
        tramite.setPersona(persona);
        tramite.setFechaInicio(new Date());
        tramite.setDescripcion(datosTramite.getDetalles());
        tramite.setNroExpediente(datosTramite.getExpediente());
        tramite.setEncargado(encargado);
        tramite.setEstado(false);
        tramiteRepository.save(tramite);

        //agregar detalle de inicio

        DetallesTramite detallesTramite = new DetallesTramite();
        detallesTramite.setTramite(tramite);
        detallesTramite.setDetalles("Tramite iniciado");
        detallesTramite.setFechaProceso(new Date());
        detallesTramite.setTipoProceso("Iniciado");
        agregarDetallesTramite(detallesTramite);

        System.out.println("Trámite registrado con éxito");

        return "Tramite registrado con exito";
    }

    public String finalizarTramite(Long idTramite) {
        Optional<Tramite> tramiteOPC = tramiteRepository.findById(idTramite);
        if (tramiteOPC.isPresent()) {
            Tramite tramite = tramiteOPC.get();
            if (tramite.getEstado() == true) {
                return "El tramite ya fue finalizado";
            }
            Optional<Tramite> tramite1 = tramiteRepository.findById(idTramite);
            DetallesTramite detallesTramite = new DetallesTramite();
            detallesTramite.setTramite(tramite1.get());
            detallesTramite.setDetalles("Tramite marcado como finalizado");
            detallesTramite.setFechaProceso(new Date());
            detallesTramite.setTipoProceso("Finalizado");
            agregarDetallesTramite(detallesTramite);
            tramite.setEstado(true);


            //cambia el estado del tramite
            tramite.setFechaFin(new Date());
            //agrega la fecha de finalizacion
            tramiteRepository.save(tramite);
            return "Trámite marcado como completado";
        } else {
            return "Trámite no encontrado";
        }
    }

    public String agregarDetallesTramite(DetallesTramite detallesTramite) {
        Optional<Tramite> tramiteOPC = tramiteRepository.findById(detallesTramite.getTramite().getIdTramite());
        if (tramiteOPC.isPresent()) {
            Tramite tramite = tramiteOPC.get();
            if (Boolean.TRUE.equals(tramite.getEstado())) {
                return "El tramite ya fue finalizado";
            }

            // Guardar archivo en disco (si hay)
            if (detallesTramite.getUrlArchivo() != null && !detallesTramite.getUrlArchivo().isEmpty()) {
                String base64 = detallesTramite.getUrlArchivo();
                if (base64.contains(",")) base64 = base64.split(",")[1];
                byte[] data = Base64.getDecoder().decode(base64);

                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();

                String nombreArchivo = System.currentTimeMillis() + "_" + detallesTramite.getNombreArchivo();
                String rutaArchivo = uploadDir + File.separator + nombreArchivo;

                try (FileOutputStream fos = new FileOutputStream(rutaArchivo)) {
                    fos.write(data);
                    detallesTramite.setNombreArchivo(nombreArchivo);
                    detallesTramite.setUrlArchivo(rutaArchivo);
                } catch (IOException e) {
                    return "Error guardando archivo: " + e.getMessage();
                }
            } else {
                detallesTramite.setNombreArchivo(null);
                detallesTramite.setUrlArchivo(null);
            }

            detallesTramite.setTramite(tramite);
            detallesTramite.setFechaProceso(new Date());
            detallesTramiteRepository.save(detallesTramite);
            return "Detalles agregados con éxito";
        } else {
            return "Trámite no encontrado, no se cargaron los detalles";
        }
    }

    //servicios simples

    //listar todos los tramites de una persona
    public List<Tramite> listarTodosTramitesPersonaDni(String dni) {
        return tramiteRepository.findByPersona_Dni(dni);
    }

    //obtener los tramites ordenados
    public List<DetallesTramite> obtenerDetallesPorTramite(Long tramiteId) {
        return detallesTramiteRepository.findByTramiteIdTramiteOrderByFechaProcesoDesc(tramiteId);
    }





}