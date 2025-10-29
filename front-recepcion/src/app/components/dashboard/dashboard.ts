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
  // Inyección de servicios y herramientas de Angular
  private fb = inject(FormBuilder);
  private personaService = inject(PersonaService);
  private tramiteService = inject(TramiteService);
  private modal = inject(ModalService);

  // Referencia de input para enfocar expediente
  @ViewChild('expedienteInput') expedienteInput!: ElementRef<HTMLInputElement>;

  // Formulario principal de registro/actualización
  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    dni: ['', Validators.required],
    telefono: ['', Validators.required],
    expediente: ['', Validators.required],
    detalles: ['', Validators.required],
    fechaInicio: [''],   
    fechaFin: [''], 
  });
  // Señales para feedback y estados de carga
  mensajeRegistro = signal('');
  loadingReg = signal(false);
  loadingActualizar = signal(false);
  // Filtros de trámites
filtroExpediente = signal('');
  filtroFechaInicio = signal('');
  filtroFechaFin = signal('');
  // Listado y filtrado de personas
  personas = signal<Persona[]>([]);
  filtroPersonas = signal('');
  personasLoading = signal(false);
  personasError = signal('');
  personaSeleccionada = signal<Persona | null>(null);

  // Listado y filtrado de trámites
  tramites = signal<Tramite[]>([]);
  cargandoTramites = signal(false);
  mostrarCompletados = signal(false);
  tecladoIndex = signal(-1);

  // Paginación
  pageSizeOptions = [5, 10, 20, 50];
  pageSize = signal(10);
  currentPage = signal(1);

  // Computed para filtro de personas según texto de búsqueda
  personasFiltradas = computed(() => {
    const term = this.filtroPersonas().toLowerCase().trim();
    const base = this.personas();
    if (!term) return base;
    return base.filter(p =>
      (p.nombre + ' ' + (p as any).apellido + ' ' + p.dni)
        .toLowerCase().includes(term)
    );
  });

  // Computed para total de páginas y personas en página actual
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

  // Computed para filtrar trámites según estado
  tramitesFiltrados = computed(() =>
    this.mostrarCompletados() ? this.tramites() : this.tramites().filter(t => !t.estado)
  );

  // Carga inicial de personas tras montar la vista
  ngAfterViewInit() {
    this.cargarPersonas();
  }

  // Descarga y refresca listado de personas desde el backend
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

  // Reinicia página y teclado tras filtrar personas
  resetPaginationAfterFilter() {
    this.currentPage.set(1);
    const list = this.personasFiltradas();
    this.tecladoIndex.set(list.length ? 0 : -1);
  }

  // Cambia página en paginación de listado de personas
  changePage(delta: number) {
    const next = this.currentPage() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.currentPage.set(next);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
  }

  // Cambia cantidad de elementos por página
  setPageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.tecladoIndex.set(this.personasPagina().length ? 0 : -1);
  }

  // Selecciona persona y carga sus trámites
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

  // Navegación con teclado en listado de personas
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
    const dniEncargado = localStorage.getItem('dni') || '';
    // Nuevo: compone el rango de fechas en texto
    const fechasPedidas = `${this.form.value.fechaInicio}-${this.form.value.fechaFin}`;
    const payload: TramiteDTO = { ...this.form.getRawValue(), dniEncargado, fechasPedidas };

    this.tramiteService.registrarTramite(payload)
      .pipe(finalize(() => this.loadingReg.set(false)))
      .subscribe({
        next: r => {
          this.mensajeRegistro.set(r && r.mensaje ? r.mensaje : 'Trámite registrado con éxito 👍');
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
            this.mensajeRegistro.set('Trámite registrado con éxito 👍');
            setTimeout(() => this.mensajeRegistro.set(''), 3000);
          } else {
            this.mensajeRegistro.set(e.error?.mensaje || 'Error al registrar');
          }
        }
      });
  }

  /**
   * Actualizar datos básicos de persona (nombre, dni, teléfono) usando tramiteService.
   * No se requiere detalles ni expediente. El loading se limpia incluso si falla.
   */
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

    // Solo los datos básicos, sin detalles, expediente ni encargado
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

  // Limpia el formulario y deselecciona persona
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

tramitesFiltradosTabla = computed(() => {
    let list = this.mostrarCompletados() ? this.tramites() : this.tramites().filter(t => !t.estado);

    // Filtrado por número de expediente si hay texto
    const exp = this.filtroExpediente().trim();
    if (exp) {
      list = list.filter(t => t.nroExpediente?.toString().includes(exp));
    }

    // Filtrado por rango de fechas si ambos están presentes
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