package com.sistema.recepcion.DTO;

//mismo proceso que el anteriora
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