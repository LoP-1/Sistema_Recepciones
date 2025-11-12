import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PersonaService } from '../../services/persona';
import { TramiteService } from '../../services/tramite';
import { TramiteDTO } from '../../models/tramite.dto';
import { Tramite } from '../../models/tramite';
import { Persona } from '../../models/persona';
import { AgregarDetallesTramite } from '../detalles/detalles';
import { ModalService } from '../../shared/ui/modal/modal.service';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements AfterViewInit {
  private fb = inject(FormBuilder);
  private personaService = inject(PersonaService);
  private tramiteService = inject(TramiteService);
  private modal = inject(ModalService);

  @ViewChild('expedienteInput') expedienteInput!: ElementRef<HTMLInputElement>;

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    expediente: ['', Validators.required],
    detalles: ['', Validators.required],
    // fechaInicio (date) stays required
    fechaInicio: ['', Validators.required],
    fechaFin: [''],
    // nuevos controles para los campos de "Períodos" (texto libre)
    periodoInicio: [''],
    periodoFin: [''],
  });

  mensajeRegistro = signal('');
  loadingReg = signal(false);
  loadingActualizar = signal(false);

  filtroExpediente = signal('');
  filtroFechaInicio = signal('');
  filtroFechaFin = signal('');

  personas = signal<Persona[]>([]);
  filtroPersonas = signal('');
  personasLoading = signal(false);
  personasError = signal('');
  personaSeleccionada = signal<Persona | null>(null);

  tramites = signal<Tramite[]>([]);
  cargandoTramites = signal(false);
  mostrarCompletados = signal(false);
  tecladoIndex = signal(-1);

  pageSizeOptions = [5, 10, 20, 50];
  pageSize = signal(10);
  currentPage = signal(1);

  personasFiltradas = computed(() => {
    const term = this.filtroPersonas().toLowerCase().trim();
    const base = this.personas();
    if (!term) return base;
    return base.filter(p =>
      (p.nombre + ' ' + (p as any).apellido + ' ' + p.dni)
        .toLowerCase().includes(term)
    );
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.personasFiltradas().length / this.pageSize()))
  );

  personasPagina = computed(() => {
    const ps = this.pageSize();
    let page = this.currentPage();
    const total = this.totalPages();
    if (page > total) page = total;
    const start = (page - 1) * ps;
    return this.personasFiltradas().slice(start, start + ps);
  });

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
        this.resetPaginationAfterFilter();
      },
      error: () => this.personasError.set('Error al cargar personas'),
      complete: () => this.personasLoading.set(false)
    });
  }

  onFiltroChange(v: string) {
    this.filtroPersonas.set(v);
    this.resetPaginationAfterFilter();
  }

  resetPaginationAfterFilter() {
    this.currentPage.set(1);
    const list = this.personasFiltradas();
    this.tecladoIndex.set(list.length ? 0 : -1);
  }

  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.currentPage.set(next);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
  }

  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
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
    const list = this.personasPagina();
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
    const periodoInicio = this.form.value.periodoInicio || '';
    const periodoFin = this.form.value.periodoFin || '';
    // el formulario ahora requiere fechaInicio
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.loadingReg.set(true);
    this.mensajeRegistro.set('');
    const dniEncargado = localStorage.getItem('dni') || '';
    // Nuevo: compone el rango de fechas en texto (si aplica)
    const fechasPedidas = `${this.form.value.fechaInicio}-${this.form.value.fechaFin}`;
    const raw = this.form.getRawValue();

    // Convertir fechaInicio del input a Date
    const fechaInicioDate = raw.fechaInicio ? new Date(raw.fechaInicio) : new Date();

    const payload: TramiteDTO = {
      nombre: raw.nombre,
      dni: raw.dni,
      telefono: raw.telefono,
      expediente: raw.expediente,
      detalles: raw.detalles,
      dniEncargado,
      fechasPedidas,
      fechaInicio: fechaInicioDate
    };

    this.tramiteService.registrarTramite(payload)
      .pipe(finalize(() => this.loadingReg.set(false)))
      .subscribe({
        next: r => {
          this.mensajeRegistro.set(r && r.mensaje ? r.mensaje : 'Trámite registrado con éxito');
          this.cargarTramitesPorDni();
          this.cargarPersonas();
          const match = this.personas().find(p => p.dni === this.form.value.dni);
          if (match) this.seleccionarPersona(match, false);
          this.form.patchValue({ expediente: '', detalles: '', fechaInicio: '', fechaFin: '' });
          setTimeout(() => this.expedienteInput?.nativeElement.focus(), 0);
          setTimeout(() => this.mensajeRegistro.set(''), 3000);
        },
        error: e => {
          if (e.status >= 200 && e.status < 300) {
            this.mensajeRegistro.set('Trámite registrado con éxito');
            setTimeout(() => this.mensajeRegistro.set(''), 3000);
          } else {
            this.mensajeRegistro.set(e.error?.mensaje || 'Error al registrar');
          }
        }
      });
  }

  actualizarDatos() {
    const controls = this.form.controls;
    if (controls.nombre.invalid || controls.dni.invalid || controls.telefono.invalid) {
      controls.nombre.markAsTouched();
      controls.dni.markAsTouched();
      controls.telefono.markAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.loadingActualizar.set(true);
    this.mensajeRegistro.set('');
    const dni = this.form.value.dni;
    const { nombre, telefono } = this.form.getRawValue();

    const payload: Partial<TramiteDTO> = { nombre, dni, telefono };

    this.tramiteService.registrarTramite(payload as TramiteDTO)
      .pipe(finalize(() => this.loadingActualizar.set(false)))
      .subscribe({
        next: _ => {
          this.mensajeRegistro.set('Datos actualizados');
          setTimeout(() => this.mensajeRegistro.set(''), 3000);
          this.cargarPersonas();
          this.cargarTramitesPorDni();
          const match = this.personas().find(p => p.dni === dni);
          if (match) this.seleccionarPersona(match, false);
        },
        error: () => {
          this.mensajeRegistro.set('Datos actualizados');
          setTimeout(() => this.mensajeRegistro.set(''), 3000);
          this.cargarPersonas();
          this.cargarTramitesPorDni();
          const match = this.personas().find(p => p.dni === dni);
          if (match) this.seleccionarPersona(match, false);
        }
      });
  }

  limpiarForm() {
    const p = this.personaSeleccionada();
    this.form.reset({
      nombre: '',
      dni: '',
      telefono: '',
      expediente: '',
      detalles: ''
    });
    this.personaSeleccionada.set(null);
  }

  getIniciales(persona: Persona): string {
    const nombre = persona.nombre?.charAt(0) || '';
    const apellido = (persona as any).apellido?.charAt(0) || '';
    return nombre + apellido;
  }

  logout() {
    localStorage.clear();
    location.reload();
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

  abrirDetalles(idTramite: number) {
    this.modal.open(AgregarDetallesTramite, {
      data: { idTramite },
      ariaLabel: 'Agregar detalles al trámite',
      width: 'min(1500px, 95vw)',
      panelClass: 'modal-sheet'
    });
  }

  tramitesFiltradosTabla = computed(() => {
    let list = this.mostrarCompletados() ? this.tramites() : this.tramites().filter(t => !t.estado);
    const exp = this.filtroExpediente().trim();
    if (exp) {
      list = list.filter(t => t.nroExpediente?.toString().includes(exp));
    }
    const ini = this.filtroFechaInicio().trim();
    const fin = this.filtroFechaFin().trim();
    list = list.filter(t => {
      const tIni = t.fechaInicio ? new Date(t.fechaInicio).getFullYear().toString() : '';
      const tFin = t.fechaFin ? new Date(t.fechaFin).getFullYear().toString() : '';
      let match = true;
      if (ini) {
        match = match && tIni >= ini;
      }
      if (fin) {
        match = match && (tFin ? tFin <= fin : true);
      }
      return match;
    });
    return list;
  });
}