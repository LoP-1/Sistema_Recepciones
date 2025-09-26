import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { PersonaService } from '../../services/persona';
import { TramiteService } from '../../services/tramite';
import { TramiteDTO } from '../../models/tramite.dto';
import { Tramite } from '../../models/tramite';
import { Persona } from '../../models/persona';
import { Navbar } from '../navbar/navbar';
import { AgregarDetallesTramite } from '../detalles/detalles';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    Navbar,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements AfterViewInit {
  private dialog = inject(MatDialog);

  private fb = inject(FormBuilder);
  private personaService = inject(PersonaService);
  private tramiteService = inject(TramiteService);

  @ViewChild('expedienteInput') expedienteInput!: ElementRef<HTMLInputElement>;

  displayedColumns: string[] = ['idTramite', 'nroExpediente', 'descripcion', 'fechaInicio', 'fechaFin', 'estado'];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    expediente: ['', Validators.required],
    detalles: ['', Validators.required],
    dniEncargado: ['', Validators.required]
  });

  mensajeRegistro = signal('');
  loadingReg = signal(false);

  personas = signal<Persona[]>([]);
  personasFiltradas = signal<Persona[]>([]);
  personaSeleccionada = signal<Persona | null>(null);
  filtroPersonas = signal('');
  personasLoading = signal(false);
  personasError = signal('');
  tramites = signal<Tramite[]>([]);
  cargandoTramites = signal(false);
  mostrarCompletados = signal(false);
  tecladoIndex = signal(-1);

  tramitesFiltrados = computed(() =>
    this.mostrarCompletados() ? this.tramites() : this.tramites().filter(t => !t.estado)
  );

  ngAfterViewInit() {
    this.cargarPersonas();
  }

  cargarPersonas() {
    this.personasLoading.set(true);
    this.personasError.set('');
    this.personaService.listar().subscribe({
      next: res => {
        this.personas.set(res);
        this.aplicarFiltro(this.filtroPersonas());
      },
      error: () => this.personasError.set('Error al cargar personas'),
      complete: () => this.personasLoading.set(false)
    });
  }

  onFiltroChange(value: any) {
    const v = typeof value === 'string' ? value : value.target?.value || '';
    this.filtroPersonas.set(v);
    this.aplicarFiltro(v);
  }

  private aplicarFiltro(term: string) {
    const t = term.toLowerCase().trim();
    if (!t) {
      this.personasFiltradas.set(this.personas());
      this.tecladoIndex.set(this.personas().length ? 0 : -1);
      return;
    }
    const filtered = this.personas().filter(p =>
      (p.nombre + ' ' + (p as any).apellido + ' ' + p.dni).toLowerCase().includes(t)
    );
    this.personasFiltradas.set(filtered);
    this.tecladoIndex.set(filtered.length ? 0 : -1);
  }

  seleccionarPersona(p: Persona, focusExpediente = true) {
    this.personaSeleccionada.set(p);
    this.form.patchValue({
      nombre: p.nombre,
      dni: p.dni,
      telefono: p.telefono || ''
    });
    this.cargarTramitesPorDni();
    if (focusExpediente) {
      setTimeout(() => this.expedienteInput?.nativeElement.focus(), 0);
    }
  }

  personasKeydown(ev: KeyboardEvent) {
    const list = this.personasFiltradas();
    if (!list.length) return;
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        this.tecladoIndex.set((this.tecladoIndex() + 1) % list.length);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        this.tecladoIndex.set((this.tecladoIndex() - 1 + list.length) % list.length);
        break;
      case 'Enter':
        ev.preventDefault();
        const idx = this.tecladoIndex();
        if (idx >= 0) this.seleccionarPersona(list[idx]);
        break;
    }
  }

  cargarTramitesPorDni() {
    const dni = this.form.value.dni;
    if (!dni) return;
    this.cargandoTramites.set(true);
    this.tramiteService.listarPorDni(dni).subscribe({
      next: r => this.tramites.set(r),
      error: () => this.tramites.set([]),
      complete: () => this.cargandoTramites.set(false)
    });
  }

  refrescarTramites() {
    if (this.personaSeleccionada()) this.cargarTramitesPorDni();
  }

  registrar() {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.loadingReg.set(true);
    this.mensajeRegistro.set('');
    const payload: TramiteDTO = this.form.getRawValue();
    this.tramiteService.registrarTramite(payload).subscribe({
      next: r => {
        this.mensajeRegistro.set(r.mensaje);
        this.cargarTramitesPorDni();
        this.cargarPersonas();
        const match = this.personas().find(p => p.dni === this.form.value.dni);
        if (match) this.seleccionarPersona(match, false);
        this.form.patchValue({ expediente: '', detalles: '' });
        setTimeout(() => this.expedienteInput?.nativeElement.focus(), 0);
      },
      error: e => this.mensajeRegistro.set(e.error?.mensaje || 'Error al registrar'),
      complete: () => this.loadingReg.set(false)
    });
  }

  limpiarForm() {
    const p = this.personaSeleccionada();
    this.form.reset({
      nombre: p?.nombre || '',
      dni: p?.dni || '',
      telefono: p?.telefono || '',
      expediente: '',
      detalles: '',
      dniEncargado: ''
    });
  }

  toggleCompletados() {
    this.mostrarCompletados.set(!this.mostrarCompletados());
  }

  trackPersona = (_: number, p: Persona) => p.idPersona;
  trackTramite = (_: number, t: Tramite) => t.idTramite;

  private focusFirstInvalid() {
    const key = Object.keys(this.form.controls).find(k => (this.form.controls as any)[k].invalid);
    if (!key) return;
    const el = document.querySelector<HTMLElement>(`[formcontrolname="${key}"]`);
    el?.focus();
  }

  seleccionarPersonaById(id: number) {
    const persona = this.personasFiltradas().find(p => p.idPersona === id);
    if (persona) {
      this.seleccionarPersona(persona);
    }
  }

  abrirDetalles(idTramite: number) {
    this.dialog.open(AgregarDetallesTramite, {
      data: { idTramite },
      width: '1200px',
      maxWidth: '90vw'
    });
  }
}