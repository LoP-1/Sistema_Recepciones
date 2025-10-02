package com.sistema.recepcion.controllers;

import com.sistema.recepcion.DTO.DniDTO;
import com.sistema.recepcion.DTO.MensajeDTO;
import com.sistema.recepcion.DTO.TramiteDTO;
import com.sistema.recepcion.models.DetallesTramite;
import com.sistema.recepcion.models.Tramite;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.sistema.recepcion.services.TramiteService;
import org.springframework.web.bind.annotation.*;
import java.util.List;


//controlador de tramites
@RestController
@RequestMapping("/tramites")
public class TramiteController {

    //injeccion del servicio, como un constructor
    @Autowired
    TramiteService tramiteService;

    // endpoint para iniciar un tramite
    @PostMapping("/registrar")
    public ResponseEntity<MensajeDTO> registrarTramite(@RequestBody TramiteDTO datosTramite) {
        //envia datos al servicio y este devuelve un texto string para ver si esta bien o mal
        String resultado = tramiteService.iniciarTramite(datosTramite);
        if (resultado.equals("Tramite registrado con exito")) {
            return ResponseEntity.ok(new MensajeDTO(resultado));
        } else {
            return ResponseEntity.badRequest().body(new MensajeDTO(resultado));
        }
    }

    // finalizar un tramite
    @PostMapping("/finalizar")
    public ResponseEntity<MensajeDTO> finalizarTramite(@RequestBody Long id) {
        //igual que el anterior , envia datos y recibe string
        String resultado = tramiteService.finalizarTramite(id);
        if (resultado.equals("Trámite marcado como completado")){
            return ResponseEntity.ok(new MensajeDTO(resultado));
        } else {
            return ResponseEntity.badRequest().body(new MensajeDTO(resultado));
        }
    }

    // listar tramites por un dni de persona
    @PostMapping("/dni")
    public ResponseEntity<List<Tramite>> listarTramitesDni(@RequestBody DniDTO dni) {
        //para este se recibe un dni y el servicio busca todos los tramites asociados a ese dni
        List<Tramite> lista = tramiteService.listarTodosTramitesPersonaDni(dni.getDni());
        return ResponseEntity.ok(lista);
    }

    //agrega detalles a un tramite
    @PostMapping("/detalles")
    public ResponseEntity<MensajeDTO> agregarDetalles(@RequestBody DetallesTramite detallesTramite) {
        //recibe un json de detalles tramite y lo guarda en la base de datos, responde con string... lo de siempre
        String resultado = tramiteService.agregarDetallesTramite(detallesTramite);
        if (resultado.equals("Detalles agregados con éxito")){
            return ResponseEntity.ok(new MensajeDTO(resultado));
        } else {
            return ResponseEntity.badRequest().body(new MensajeDTO(resultado));
        }
    }

    //se recibe el id del tramite y se listan los detalles, creacion etc
    @PostMapping("/historial")
    public ResponseEntity <List<DetallesTramite>> obtenerHistorial (@RequestBody Long id){
        List<DetallesTramite> historial = tramiteService.obtenerDetallesPorTramite(id);
        return ResponseEntity.ok(historial);
    }



}