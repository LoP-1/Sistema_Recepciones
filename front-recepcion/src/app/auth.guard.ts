// Guardia para proteger rutas: solo permite acceso si hay token
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  if (!token) {
    // Redirecciona al login si no hay token
    return router.createUrlTree(['/login']);
  }
  return true;
};