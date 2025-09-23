package com.sistema.recepcion.controllers;

import com.sistema.recepcion.DTO.TramiteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.sistema.recepcion.service.TramiteService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tramites")
public class TramiteController {

    @Autowired
    TramiteService tramiteService;

    //endpoint para registrar un tramite
    @PostMapping("/registrar")
    public ResponseEntity<String> registrarTramite(@RequestBody TramiteDTO datosTramite) {
        String resultado = tramiteService.realizarTramite(datosTramite);
        if (resultado.equals("Tramite registrado con exito")) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

}
