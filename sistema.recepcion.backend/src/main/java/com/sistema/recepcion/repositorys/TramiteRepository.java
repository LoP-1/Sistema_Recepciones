package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.Tramite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TramiteRepository extends JpaRepository<Tramite, Long> {
    //buscar un tramite por dni, el tramite es hijo de la persona por eso se puede hacer la busqueda
    List<Tramite> findByPersona_Dni(String dni);
    //encontrar por id, tooodo el tramite
    Optional<Tramite> findById(Long id);
}
