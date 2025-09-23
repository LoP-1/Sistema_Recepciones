package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Tramite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TramiteRepository extends JpaRepository<Tramite, Long> {
    List<Tramite> findByPersona_Dni(String dni);
    Optional<Tramite> findById(Long id);
}
