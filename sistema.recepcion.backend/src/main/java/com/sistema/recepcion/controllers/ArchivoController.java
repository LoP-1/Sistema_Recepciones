package com.sistema.recepcion.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/download")
public class ArchivoController {

    @Value("${archivos.tramites.upload-dir}")
    private String uploadDir;

    @GetMapping("/{nombreArchivo}")
    public ResponseEntity<Resource> descargarArchivo(@PathVariable String nombreArchivo) {
        try {
            // Evitar traversal: quedarse solo con el nombre "limpio"
            String safeFileName = Paths.get(nombreArchivo).getFileName().toString();
            Path filePath = Paths.get(uploadDir).resolve(safeFileName).normalize();

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            String encodedFileName = URLEncoder.encode(safeFileName, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    // Para que el navegador lo descargue
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    // Exponerlo (si el front lo necesita)
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}