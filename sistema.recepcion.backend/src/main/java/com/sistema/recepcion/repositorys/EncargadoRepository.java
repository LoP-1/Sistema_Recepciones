package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Encargado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EncargadoRepository extends JpaRepository<Encargado,Long> {
    Optional<Encargado> findByDni(String dni);
}
