package com.sistema.recepcion.service;

import com.sistema.recepcion.DTO.TramiteDTO;
import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.models.Persona;
import com.sistema.recepcion.models.Tramite;
import com.sistema.recepcion.repositorys.EncargadoRepository;
import com.sistema.recepcion.repositorys.PersonaRepository;
import com.sistema.recepcion.repositorys.TramiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class TramiteService {

    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private EncargadoRepository encargadoRepository;

    @Autowired
    private TramiteRepository tramiteRepository;

    public String realizarTramite(TramiteDTO datosTramite) {
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
        Encargado encargado = encargadoRepository.findByDni(datosTramite.getDniEncargado());
        if (encargado == null) {
            return "Encargado no encontrado";
        }

        // Crear y guardar el trámite
        Tramite tramite = new Tramite();
        tramite.setPersona(persona);
        tramite.setFechaInicio(new Date());
        tramite.setDescripcion(datosTramite.getDetalles());
        tramite.setNroExpediente(datosTramite.getExpediente());
        tramite.setEncargado(encargado);
        tramite.setEstado(false);
        tramiteRepository.save(tramite);
        System.out.println("Trámite registrado con éxito");

        return "Tramite registrado con exito";
    }

    public String finalizarTramite(Long idTramite){
        Optional<Tramite> tramiteOPC = tramiteRepository.findById(idTramite);
        if (tramiteOPC.isPresent()){
            Tramite tramite = tramiteOPC.get();
        }else{
            return "Trámite no encontrado";
        }
        tramite.setEstado(true);
        tramite.setFechaFin(new Date());
        tramiteRepository.save(tramite);
        return "Trámite marcado como completado";
    }


    //servicios simples
    public List<Tramite> buscarTramitesPorDni(String dni){
        return tramiteRepository.findByPersona_Dni(dni);
    }

}