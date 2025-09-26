import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { AgregarDetallesTramite } from './components/detalles/detalles';

export const routes: Routes = [
  { path: '', component: Dashboard }, 
  { path: 'detalles', component: AgregarDetallesTramite },
];