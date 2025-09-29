import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
    dniEncargado: ['', Validators.required]
  });

  mensajeRegistro = signal('');
  loadingReg = signal(false);

  personas = signal<Persona[]>([]);
  filtroPersonas = signal('');
  personasLoading = signal(false);
  personasError = signal('');
  personaSeleccionada = signal<Persona | null>(null);

  tramites = signal<Tramite[]>([]);
  cargandoTramites = signal(false);
  mostrarCompletados = signal(false);
  tecladoIndex = signal(-1);

  // Paginación
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

  abrirDetalles(idTramite: number) {
  this.modal.open(AgregarDetallesTramite, {
  data: { idTramite },
  ariaLabel: 'Agregar detalles al trámite',
  width: 'min(1400px, 95vw)',
  panelClass: 'modal-sheet'
});
}
}