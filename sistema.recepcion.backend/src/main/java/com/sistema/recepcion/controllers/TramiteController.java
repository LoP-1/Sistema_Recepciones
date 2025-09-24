package com.sistema.recepcion.controllers;

import com.sistema.recepcion.DTO.MensajeDTO;
import com.sistema.recepcion.DTO.TramiteDTO;
import com.sistema.recepcion.models.Tramite;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.sistema.recepcion.services.TramiteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tramites")
public class TramiteController {

    @Autowired
    TramiteService tramiteService;

    // endpoint para registrar un tramite
    @PostMapping("/registrar")
    public ResponseEntity<MensajeDTO> registrarTramite(@RequestBody TramiteDTO datosTramite) {
        String resultado = tramiteService.realizarTramite(datosTramite);
        if (resultado.equals("Tramite registrado con exito")) {
            return ResponseEntity.ok(new MensajeDTO(resultado));
        } else {
            return ResponseEntity.badRequest().body(new MensajeDTO(resultado));
        }
    }

    // finalizar un tramite
    @PostMapping("/finalizar")
    public ResponseEntity<MensajeDTO> finalizarTramite(@RequestBody Long id) {
        String resultado = tramiteService.finalizarTramite(id);
        if (resultado.equals("Trámite marcado como completado")){
            return ResponseEntity.ok(new MensajeDTO(resultado));
        } else {
            return ResponseEntity.badRequest().body(new MensajeDTO(resultado));
        }
    }

    // listar tramites por un dni de persona
    @PostMapping("/dni")
    public ResponseEntity<List<Tramite>> listarTramitesDni(@RequestParam String dni) {
        List<Tramite> lista = tramiteService.listarTodosTramitesPersonaDni(dni);
        return ResponseEntity.ok(lista);
    }
}