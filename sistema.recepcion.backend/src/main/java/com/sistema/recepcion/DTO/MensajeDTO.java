package com.sistema.recepcion.DTO;

public class MensajeDTO {
        private String message;

        public MensajeDTO(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }