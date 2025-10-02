// Definición de rutas principales y protección con guardia de autenticación
import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { AgregarDetallesTramite } from './components/detalles/detalles';
import { Login } from './components/login/login';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'detalles', component: AgregarDetallesTramite, canActivate: [authGuard] },
];