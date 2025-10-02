package com.sistema.recepcion.controllers;

import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.services.EncargadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//controlador del encargado, se pueden agregar mas url sin problemas solo crear el servicio
@RestController
@RequestMapping("/encargado")
public class EncargadoController {
    @Autowired
    EncargadoService encargadoService;

    //ventana de registrar, recibe un json con la estructura del encargado y lo guarda en la base de datos
    @PostMapping("/registrar")
    public ResponseEntity<String> registrarEncargado(@RequestBody Encargado encargado){
        //esto crea un string y lo guarda con el resultado de guardarEncargado()
        //la logica se maneja en encargado service
        String resultado = encargadoService.guardarEncargado(encargado);

        if (resultado.equals("Encargado registrado con exito")) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    //endpoint para realizar un login ,recibe un dni y contraseña
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        //se pasan al servicio y este devuelve un token, que se manda al cliente angular
        String token = encargadoService.login(request.dni(), request.password());
        return ResponseEntity.ok(new JwtResponse(token));
    }


    //records donde se definen json, uno para recibir dni y password
    public record LoginRequest(String dni, String password) {}
    //otro para devolver el token en json
    public record JwtResponse(String token) {}


}
