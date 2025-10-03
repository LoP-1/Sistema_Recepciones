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

//el servicio mas largo pero no dificil...
@Service
public class TramiteService {

    //este valor lo optiene del archivo properties
    @Value("${archivos.tramites.upload-dir}")
    private String uploadDir;

    //aca se traen a los repositorios para usarse se "injectan"
    @Autowired
    private PersonaRepository personaRepository;

    @Autowired
    private EncargadoRepository encargadoRepository;

    @Autowired
    private DetallesTramiteRepository detallesTramiteRepository;

    @Autowired
    private TramiteRepository tramiteRepository;


//se recibe el tramitedto, previanente definido ... en otras palabras llega un json con los valores de TramiteDTO
    public String iniciarTramite(TramiteDTO datosTramite) {
        // Buscar persona por DNI
        Persona persona = personaRepository.findByDni(datosTramite.getDni());
        //y le guarda los datos, ahora se llama "persona"
        //si la persona no existia en la base de datos , le guarda los datos
        if (persona == null) {
            persona = new Persona();
            persona.setDni(datosTramite.getDni());
            persona.setTelefono(datosTramite.getTelefono());
            persona.setNombre(datosTramite.getNombre());
            personaRepository.save(persona);
            System.out.println("Persona creada con exito");
        } else {
            //si no exisita en la base de datos, se actualiza el telefono y el nombre
            persona.setTelefono(datosTramite.getTelefono());
            persona.setNombre(datosTramite.getNombre());
            //el dni sirve como identificador unico
            personaRepository.save(persona);
            System.out.println("Persona actualizada con exito");
        }

        // Buscar encargado por DNI, sirve para llevar la cuenta de cuantas personas llegaron por encargado todavia no se usa pero ahi esta
        Optional<Encargado> optionalEncargado = encargadoRepository.findByDni(datosTramite.getDniEncargado());
        //si no hay encargado se termina el proceso, no se puede recepcionar solo el cliente o persona :D
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
        tramite.setFechas(datosTramite.getFechasPedidas());
        tramiteRepository.save(tramite);

        //agregar detalle de inicio
        //aca se crea un detalle nuevo, para el historial, guarda la fecha y hora y añade el texto para un tramite iniciado
        DetallesTramite detallesTramite = new DetallesTramite();
        detallesTramite.setTramite(tramite);
        detallesTramite.setDetalles("Tramite iniciado");
        detallesTramite.setFechaProceso(new Date());
        detallesTramite.setTipoProceso("Iniciado");
        agregarDetallesTramite(detallesTramite);
    //mensaje de exito.. solo se ve por consola
        System.out.println("Trámite registrado con éxito");
    //se termina el proceso y este mensaje si lo veran en el sistema
        return "Tramite registrado con exito";
    }


    //metodo para marcar un tramite como finalizado, recibe el id del tramite
    public String finalizarTramite(Long idTramite) {
        //busca el tramite en la bd
        Optional<Tramite> tramiteOPC = tramiteRepository.findById(idTramite);
        //si el tramite ya fue marcado anteriormente como finalizado se termina el proceso y se manda el mensaje
        if (tramiteOPC.isPresent()) {
            Tramite tramite = tramiteOPC.get();
            if (tramite.getEstado() == true) {
                //este mensaje
                return "El tramite ya fue finalizado";
            }
            //si no fue finalizado se prosigue
            //se busca el tramite que se usara
            Optional<Tramite> tramite1 = tramiteRepository.findById(idTramite);
            //se crea un detalle de tramite para agregar al tramite y tener historial
            DetallesTramite detallesTramite = new DetallesTramite();
            detallesTramite.setTramite(tramite1.get());
            detallesTramite.setDetalles("Tramite marcado como finalizado");
            detallesTramite.setFechaProceso(new Date());
            detallesTramite.setTipoProceso("Finalizado");
            agregarDetallesTramite(detallesTramite);
            //se pone estado true = finalizado y ya :D
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

    //esto agrega un detalle a cada tramite, estos son en otras palabras el historial, se guarda con mensaje y fecha de creacion del detalle
        //recibe un detalleTramite , no el dto .. se puede usar el DetallesTramite(model) tambien como un dto grante
    public String agregarDetallesTramite(DetallesTramite detallesTramite) {
        //encuentra el tramite por id
        //esto busca el detalle de tramite, luego el tramite asociado y le saca el id
        Optional<Tramite> tramiteOPC = tramiteRepository.findById(detallesTramite.getTramite().getIdTramite());
        if (tramiteOPC.isPresent()) {
            Tramite tramite = tramiteOPC.get();
            //revisar si no tiene el boolean "true"
            if (Boolean.TRUE.equals(tramite.getEstado())) {
                return "El tramite ya fue finalizado";
            }

            // Esto guarda archivo en disco (si hay...)
            if (detallesTramite.getUrlArchivo() != null && !detallesTramite.getUrlArchivo().isEmpty()) {
                String base64 = detallesTramite.getUrlArchivo();
                if (base64.contains(",")) base64 = base64.split(",")[1];
                byte[] data = Base64.getDecoder().decode(base64);

                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();
                //estos son los datos importantes que van en la base de datos
                //para tener acceso a ellos
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

            // campos nuevos para boleta y monto, ok!
            detallesTramite.setMonto(detallesTramite.getMonto());
            detallesTramite.setBoleta(detallesTramite.getBoleta());

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