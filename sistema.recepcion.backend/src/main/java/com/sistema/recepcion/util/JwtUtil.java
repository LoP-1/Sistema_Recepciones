package com.sistema.recepcion.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

import static io.jsonwebtoken.Claims.EXPIRATION;

@Component
public class JwtUtil {

    private static final String SECRET = "LaClaveSecretaMasSeguraDelOeste_2025_!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String generateToken(String dni) {
        return Jwts.builder()
                .subject(dni)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86400000)) // 1 día
                .signWith(key)
                .compact();
    }

    public String extractDni(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

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