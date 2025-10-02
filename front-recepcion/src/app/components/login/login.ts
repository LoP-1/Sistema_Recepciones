// Componente de login para autenticación de usuario por DNI y contraseña.
// Maneja validación, solicitudes al backend y almacenamiento de token.

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [ReactiveFormsModule]
})
export class Login {
  loading = false;  // Estado de carga al enviar el formulario
  error = '';       // Mensaje de error para feedback al usuario

  private baseUrl = `${environment.apiUrl}/encargado`;

  // Formulario reactivo de login
  loginForm;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  // Envía los datos del login al backend y maneja la respuesta
  submit() {
    this.error = '';
    this.loading = true;

    if (this.loginForm.invalid) {
      this.loading = false;
      return;
    }
    const dni = this.loginForm.value.dni ?? '';
    const password = this.loginForm.value.password ?? '';
    this.http.post<{ token: string }>(`${this.baseUrl}/login`, { dni, password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('dni', dni);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.error = 'usuario o contraseña incorrectos';
      }
    });
  }
}