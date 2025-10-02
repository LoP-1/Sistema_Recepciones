package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Encargado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EncargadoRepository extends JpaRepository<Encargado,Long> {
    //encontrar por dni la lista de encargados
    Optional<Encargado> findByDni(String dni);
}
