package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.DetallesTramite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetallesTramiteRepository extends JpaRepository<DetallesTramite, Long> {
    List<DetallesTramite> findByTramiteIdTramiteOrderByFechaProcesoDesc(Long idTramite);
}
