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
  mode: 'login' | 'register' = 'login';

  loginForm;
  registerForm;
  loading = false;
  error = '';

  private baseUrl = `${environment.apiUrl}/encargado`;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  switchMode(mode: 'login' | 'register') {
    this.mode = mode;
    this.error = '';
    this.loading = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  submit() {
    this.error = '';
    this.loading = true;

    if (this.mode === 'login') {
      if (this.loginForm.invalid) {
        this.loading = false;
        return;
      }
      const dni = this.loginForm.value.dni ?? '';
      const password = this.loginForm.value.password ?? '';
      this.http.post<{ token: string }>(`${this.baseUrl}/login`, { dni, password }).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);     // Guarda el JWT
          localStorage.setItem('dni', dni);             // Guarda el DNI
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'DNI o contraseña inválidos';
        }
      });
    } else {
      if (this.registerForm.invalid) {
        this.loading = false;
        return;
      }
      // El objeto encargado ya tiene nombre, apellido, dni, password
      const encargado = this.registerForm.value;
      this.http.post<string>(`${this.baseUrl}/registrar`, encargado, { responseType: 'text' as any }).subscribe({
        next: () => {
          this.loading = false;
          this.switchMode('login');
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error || 'Error al registrar';
        }
      });
    }
  }
}