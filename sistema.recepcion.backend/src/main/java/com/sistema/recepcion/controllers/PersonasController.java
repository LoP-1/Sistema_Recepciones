package com.sistema.recepcion.controllers;

import com.sistema.recepcion.models.Persona;
import com.sistema.recepcion.services.PersonaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

//controlador de personas , igual que los anteriores
@RestController
@RequestMapping("/personas")
public class PersonasController {

    @Autowired
    private PersonaService personaService;

    //obtener lista de todas las personas
    @GetMapping()
    public List<Persona> obtenerPersonas() {
        return personaService.listarPersonas();
    }

}
