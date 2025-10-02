package com.sistema.recepcion.services;

import com.sistema.recepcion.models.Persona;
import com.sistema.recepcion.repositorys.PersonaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonaService {

    @Autowired
    private PersonaRepository personaRepository;

    //listar todas las personas
    public List<Persona> listarPersonas() {
        //el repositorio ya tenia el metodo :p
       List<Persona> personas = personaRepository.findAll();
        return personas;
    }

}
