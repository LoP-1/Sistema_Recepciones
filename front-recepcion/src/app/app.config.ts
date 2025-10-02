// Configuración principal de la aplicación Angular
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo global de errores en el navegador
    provideBrowserGlobalErrorListeners(),
    // Habilita la detección de cambios sin zone.js
    provideZonelessChangeDetection(),
    // Configura las rutas principales de la app
    provideRouter(routes),
    // Configura el HttpClient con interceptor de autenticación
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};