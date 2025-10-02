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

// Dashboard principal para la gestión de trámites y personas
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements AfterViewInit {
  // Servicios y utilidades de Angular
  private fb = inject(FormBuilder);
  private personaService = inject(PersonaService);
  private tramiteService = inject(TramiteService);
  private modal = inject(ModalService);

  // Referencia al campo de expediente para manejar el foco
  @ViewChild('expedienteInput') expedienteInput!: ElementRef<HTMLInputElement>;

  // Formulario reactivo para registrar trámites
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    expediente: ['', Validators.required],
    detalles: ['', Validators.required],
  });

  // Estado y feedback de registro de trámite
  mensajeRegistro = signal('');
  loadingReg = signal(false);

  // Listado y filtro de personas
  personas = signal<Persona[]>([]);
  filtroPersonas = signal('');
  personasLoading = signal(false);
  personasError = signal('');
  personaSeleccionada = signal<Persona | null>(null);

  // Listado y estado de trámites por persona seleccionada
  tramites = signal<Tramite[]>([]);
  cargandoTramites = signal(false);
  mostrarCompletados = signal(false);
  tecladoIndex = signal(-1);

  // Configuración de paginación
  pageSizeOptions = [5, 10, 20, 50];
  pageSize = signal(10);
  currentPage = signal(1);

  // Personas filtradas por búsqueda
  personasFiltradas = computed(() => {
    const term = this.filtroPersonas().toLowerCase().trim();
    const base = this.personas();
    if (!term) return base;
    return base.filter(p =>
      (p.nombre + ' ' + (p as any).apellido + ' ' + p.dni)
        .toLowerCase().includes(term)
    );
  });

  // Cálculo de páginas para la paginación
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.personasFiltradas().length / this.pageSize()))
  );

  // Personas a mostrar en la página actual
  personasPagina = computed(() => {
    const ps = this.pageSize();
    let page = this.currentPage();
    const total = this.totalPages();
    if (page > total) page = total;
    const start = (page - 1) * ps;
    return this.personasFiltradas().slice(start, start + ps);
  });

  // Trámites filtrados según el estado
  tramitesFiltrados = computed(() =>
    this.mostrarCompletados() ? this.tramites() : this.tramites().filter(t => !t.estado)
  );

  // Cargar personas al inicializar el componente
  ngAfterViewInit() {
    this.cargarPersonas();
  }

  // Descarga listado de personas desde el backend
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

  // Actualiza filtro de personas y reinicia paginación
  onFiltroChange(v: string) {
    this.filtroPersonas.set(v);
    this.resetPaginationAfterFilter();
  }

  // Reinicia la página y el índice del teclado tras filtrar
  resetPaginationAfterFilter() {
    this.currentPage.set(1);
    const list = this.personasFiltradas();
    this.tecladoIndex.set(list.length ? 0 : -1);
  }

  // Cambia de página en la paginación de personas
  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.currentPage.set(next);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
  }

  // Cambia la cantidad de elementos por página
  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
  }

  // Selecciona una persona y carga sus trámites
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

  // Navegación con teclado en el listado de personas
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

  // Descarga trámites vinculados al DNI actual
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

  // Refresca trámites del usuario seleccionado
  refrescarTramites() {
    if (this.personaSeleccionada()) this.cargarTramitesPorDni();
  }

  // Envía el formulario para registrar un nuevo trámite
  registrar() {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.loadingReg.set(true);
    this.mensajeRegistro.set('');
    // Obtiene el DNI encargado desde localStorage
    const dniEncargado = localStorage.getItem('dni') || '';
    const payload: TramiteDTO = { ...this.form.getRawValue(), dniEncargado };

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

  // Limpia el formulario, restaurando datos si hay una persona seleccionada
  limpiarForm() {
    const p = this.personaSeleccionada();
    this.form.reset({
      nombre: p?.nombre || '',
      dni: p?.dni || '',
      telefono: p?.telefono || '',
      expediente: '',
      detalles: ''
    });
  }

  // Cierra sesión y recarga la app
  logout() {
    localStorage.clear();
    location.reload();
  }

  // Alterna entre mostrar trámites activos o completados
  toggleCompletados() {
    this.mostrarCompletados.set(!this.mostrarCompletados());
  }

  // Trackers para optimizar renderizado de listas
  trackPersona = (_: number, p: Persona) => p.idPersona;
  trackTramite = (_: number, t: Tramite) => t.idTramite;

  // Enfoca el primer campo inválido del formulario
  private focusFirstInvalid() {
    const key = Object.keys(this.form.controls).find(k => (this.form.controls as any)[k].invalid);
    if (!key) return;
    const el = document.querySelector<HTMLElement>(`[formcontrolname="${key}"]`);
    el?.focus();
  }

  // Abre el modal para agregar detalles a un trámite
  abrirDetalles(idTramite: number) {
    this.modal.open(AgregarDetallesTramite, {
      data: { idTramite },
      ariaLabel: 'Agregar detalles al trámite',
      width: 'min(1400px, 95vw)',
      panelClass: 'modal-sheet'
    });
  }
}