import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Persona } from '../models/persona';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/personas`;

  listar(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.base);
  }
}