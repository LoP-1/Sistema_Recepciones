import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'tramite', loadComponent: () => import('./components/tramite/tramite').then(m => m.Tramite) },
      { path: 'historial', loadComponent: () => import('./components/historial/historial').then(m => m.Historial) },
      { path: 'detalles', loadComponent: () => import('./components/detalles/detalles').then(m => m.Detalles) },
      { path: '', redirectTo: 'tramite', pathMatch: 'full' }
    ]
  }
];