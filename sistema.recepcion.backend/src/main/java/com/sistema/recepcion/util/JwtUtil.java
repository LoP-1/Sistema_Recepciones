package com.sistema.recepcion.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

//el creador de tokens
@Component
public class JwtUtil {

    //la clave secreta que se usa para cifrar los tokens, puede ser cualquier cosa , pero debe ser de esa longitud
    private static final String SECRET = "LaClaveSecretaMasSeguraDelOeste_2025_!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    //recibe el dni
    public String generateToken(String dni) {
        return Jwts.builder()
                //agrega fecha de finalizacion, creacion y clave
                .subject(dni)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86400000)) // 1 día
                .signWith(key)
                .compact();
    }

    //cada token guarda varios datos, pero este metodo desencripta y extra el dni
    public String extractDni(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }


    //este metodo revisa si el token es valido, y no solo copiaron uno de internet
    //... revisa la coincidencia con la clave secreta
    public boolean isTokenValid(String token, String dni) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject().equals(dni) && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}