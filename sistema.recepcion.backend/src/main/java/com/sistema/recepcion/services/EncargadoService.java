package com.sistema.recepcion.services;

import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.repositorys.EncargadoRepository;
import com.sistema.recepcion.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EncargadoService {

    @Autowired
    EncargadoRepository encargadoRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public String guardarEncargado(Encargado encargado){
        encargadoRepository.save(encargado);
        return "Encargado registrado con exito";
    }


    public String login(String dni, String password) {
        return encargadoRepository.findByDni(dni)
                .filter(encargado -> encargado.getPassword().equals(password))
                .map(encargado -> jwtUtil.generateToken(dni))
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
    }

}
