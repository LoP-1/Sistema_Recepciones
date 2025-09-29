package com.sistema.recepcion.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController("/")
public class ArchivoController {

 @Value("${archivos.tramites.upload-dir}")
private String uploadDir;

@GetMapping("/{nombreArchivo}")
public ResponseEntity<Resource> descargarArchivo(@PathVariable String nombreArchivo) {
    try {
        Path filePath = Paths.get(uploadDir).resolve(nombreArchivo).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"")
                .body(resource);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().build();
    }
}
}
