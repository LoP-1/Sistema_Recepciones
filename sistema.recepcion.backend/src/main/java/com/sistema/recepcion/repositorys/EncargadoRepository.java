package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Encargado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EncargadoRepository extends JpaRepository<Encargado,Long> {
    Encargado findByDni(String dni);
}
