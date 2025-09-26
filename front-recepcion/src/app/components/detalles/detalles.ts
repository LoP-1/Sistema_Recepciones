import { Component, inject, signal, computed, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { TramiteService } from '../../services/tramite';
import { DetallesTramite } from '../../models/detalles-tramite';
import { HistorialProceso } from '../../models/historial';
import { Navbar } from '../navbar/navbar';
import { FileDropDirective } from './file-drop-directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ArchivoPreview {
  file: File;
  nombre: string;
  tamanoKb: number;
  tipo: string;
  esImagen: boolean;
  base64?: string;
}

@Component({
  standalone: true,
  selector: 'app-agregar-detalles-tramite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Navbar,
    FileDropDirective,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './detalles.html',
  styleUrl: './detalles.css'
})
export class AgregarDetallesTramite implements OnInit {
  private fb = inject(FormBuilder);
  private tramiteService = inject(TramiteService);

  tiposProceso = [
    'Seguimiento',
    'Llamada',
    'Verificación',
    'Adjunto',
    'Observación'
  ];

  form = this.fb.nonNullable.group({
    idTramite: [0, [Validators.required, Validators.min(1)]],
    tipoProceso: ['Seguimiento', Validators.required],
    detalles: ['', [Validators.required, Validators.minLength(5)]]
  });

  archivo = signal<ArchivoPreview | null>(null);
  cargando = signal(false);
  mensaje = signal('');
  esError = signal(false);
  maxSizeBytes = 5 * 1024 * 1024;
  ariaLive = computed(() => this.mensaje());

  // Timeline/historial
  historial = signal<HistorialProceso[]>([]);
  cargandoHistorial = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { idTramite?: number }) {
    if (data?.idTramite) {
      this.form.patchValue({ idTramite: data.idTramite });
    }
  }

  ngOnInit() {
    this.cargarHistorial();
    this.form.controls.idTramite.valueChanges.subscribe(() => this.cargarHistorial());
  }

  cargarHistorial() {
    const idTramite = (this.form.value.idTramite ?? this.data?.idTramite) ?? 0;
    if (idTramite > 0) {
      this.cargandoHistorial.set(true);
      this.tramiteService.obtenerHistorial(idTramite).subscribe({
        next: res => this.historial.set(res),
        error: () => this.historial.set([]),
        complete: () => this.cargandoHistorial.set(false)
      });
    } else {
      this.historial.set([]);
    }
  }

  onFileInputChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.procesarFile(input.files[0]);
      input.value = '';
    }
  }

  onFileDropped(files: FileList) {
    if (files.length) this.procesarFile(files[0]);
  }

  private procesarFile(file: File) {
    if (file.size > this.maxSizeBytes) {
      this.mensaje.set(`El archivo supera el límite de ${(this.maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`);
      this.esError.set(true);
      return;
    }
    const esImagen = file.type.startsWith('image/');
    const preview: ArchivoPreview = {
      file,
      nombre: file.name,
      tamanoKb: +(file.size / 1024).toFixed(1),
      tipo: file.type || 'desconocido',
      esImagen
    };
    const reader = new FileReader();
    reader.onload = () => {
      preview.base64 = reader.result as string;
      this.archivo.set(preview);
    };
    reader.readAsDataURL(file);
  }

  quitarArchivo() {
    this.archivo.set(null);
  }

  guardar() {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.cargando.set(true);
    this.mensaje.set('');
    this.esError.set(false);

    const archivoPreview = this.archivo();
    const payload: DetallesTramite = {
      tramite: { idTramite: this.form.value.idTramite! },
      tipoProceso: this.form.value.tipoProceso!,
      detalles: this.form.value.detalles!,
      nombreArchivo: archivoPreview?.nombre || '',
      urlArchivo: archivoPreview?.base64 || ''
    };

    this.tramiteService.agregarDetalles(payload).subscribe({
      next: r => {
        this.mensaje.set(r.mensaje || 'Detalles guardados');
        this.esError.set(false);
        this.form.patchValue({ detalles: '' });
        this.archivo.set(null);
        this.cargarHistorial();
      },
      error: e => {
        this.mensaje.set(e.error?.mensaje || e.error?.message || 'Error al guardar');
        this.esError.set(true);
      },
      complete: () => this.cargando.set(false)
    });
  }

  limpiarTodo() {
    this.form.reset({
      idTramite: this.data?.idTramite || 0,
      tipoProceso: 'Seguimiento',
      detalles: ''
    });
    this.archivo.set(null);
    this.mensaje.set('');
    this.esError.set(false);
    this.cargarHistorial();
  }

  private focusFirstInvalid() {
    const invalidKey = Object.keys(this.form.controls)
      .find(k => (this.form.controls as any)[k].invalid);
    if (!invalidKey) return;
    const el = document.querySelector<HTMLElement>(`[formcontrolname="${invalidKey}"]`);
    el?.focus();
  }
}