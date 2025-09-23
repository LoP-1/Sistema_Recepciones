package com.sistema.recepcion.services;

import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.repositorys.EncargadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EncargadoService {

    @Autowired
    EncargadoRepository encargadoRepository;

    public String guardarEncargado(Encargado encargado){
        encargadoRepository.save(encargado);
        return "Encargado registrado con exito";
    }


}
