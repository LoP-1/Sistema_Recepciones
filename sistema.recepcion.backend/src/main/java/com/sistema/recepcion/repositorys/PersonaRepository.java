package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Persona;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<Persona,Long> {
    Persona findByDni(String dni);
}
