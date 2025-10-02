package com.sistema.recepcion.repositorys;

import com.sistema.recepcion.models.DetallesTramite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

//los repositorios son como crear consultas para la base de datos, pero al usar jpa la mayoria se crean solos
//con su nombre como descripcion en ingles "findbytramiteid" busca el tramite por id, algunos mas especificos se pueden agregar aca
public interface DetallesTramiteRepository extends JpaRepository<DetallesTramite, Long> {
    List<DetallesTramite> findByTramiteIdTramiteOrderByFechaProcesoDesc(Long idTramite);
}
