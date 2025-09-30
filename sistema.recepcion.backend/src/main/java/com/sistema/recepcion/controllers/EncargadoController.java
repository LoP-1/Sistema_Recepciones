package com.sistema.recepcion.controllers;

import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.services.EncargadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/encargado")
public class EncargadoController {
    @Autowired
    EncargadoService encargadoService;

    @PostMapping("/registrar")
    public ResponseEntity<String> registrarEncargado(@RequestBody Encargado encargado){
        String resultado = encargadoService.guardarEncargado(encargado);

        if (resultado.equals("Encargado registrado con exito")) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }


    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        String token = encargadoService.login(request.dni(), request.password());
        return ResponseEntity.ok(new JwtResponse(token));
    }

    public record LoginRequest(String dni, String password) {}
    public record JwtResponse(String token) {}


}
