package com.sistema.recepcion.services;

import com.sistema.recepcion.models.Encargado;
import com.sistema.recepcion.repositorys.EncargadoRepository;
import com.sistema.recepcion.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

//servicio, llama a los repositorios y envia datos a la base de datos, y luego manda las respuestas a los controladores
// asi el cliente angular las ve
@Service
public class EncargadoService {

    @Autowired
    EncargadoRepository encargadoRepository;

    @Autowired
    private JwtUtil jwtUtil;

    //recibe un json con forma de Encargado (el modelo encargado)
    public String guardarEncargado(Encargado encargado){
        //lo guarda, si el repositorio trae el crud por defecto
        encargadoRepository.save(encargado);
        return "Encargado registrado con exito";
    }

    //recibe el dni y contraseña
    public String login(String dni, String password) {
        //encuentra el encargado si es que existe en la base de datos
        return encargadoRepository.findByDni(dni)
                //revisa coincidencia de contraseña
                .filter(encargado -> encargado.getPassword().equals(password))
                //crea un token unico con el JwtUtil, usando el dni y la contraseña que defini en el otro archivo
                .map(encargado -> jwtUtil.generateToken(dni))
                //si falla , manda el mensaje
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));
    }

}
