import {
  Component,
  inject,
  signal,
  computed,
  Inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TramiteService } from '../../services/tramite';
import { DetallesTramite } from '../../models/detalles-tramite';
import { HistorialProceso } from '../../models/historial';

import { FileDropDirective } from './file-drop-directive';
import { ModalRef } from '../../shared/ui/modal/modal-ref';
import { MODAL_DATA } from '../../shared/ui/modal/modal.tokens';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environments';

interface ArchivoPreview {
  file: File;
  nombre: string;
  tamanoKb: number;
  tipo: string;
  esImagen: boolean;
  base64?: string;               // Para envío al backend (imagen o PDF)
  objectUrl?: string;            // Para preview rápida (PDF / otros)
  safeUrl?: SafeResourceUrl;     // Versión saneada para iframe/object
  cargaFallida?: boolean;        // Para detectar bloqueo en Edge
}

@Component({
  standalone: true,
  selector: 'app-agregar-detalles-tramite',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FileDropDirective],
  templateUrl: './detalles.html',
  styleUrl: './detalles.css'
})
export class AgregarDetallesTramite implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private tramiteService = inject(TramiteService);
  private modalRef = inject(ModalRef<AgregarDetallesTramite>);
  private sanitizer = inject(DomSanitizer);

  tiposProceso = ['Seguimiento','Llamada','Verificación','Adjunto','Observación'];

  form = this.fb.nonNullable.group({
    // idTramite eliminado del form visual, pero sigue en el modelo
    tipoProceso: ['Seguimiento', Validators.required],
    detalles: ['', [Validators.required, Validators.minLength(5)]]
  });

  archivo = signal<ArchivoPreview | null>(null);

  cargando = signal(false);
  mensaje  = signal('');
  esError  = signal(false);
  maxSizeBytes = 5 * 1024 * 1024;

  historial = signal<HistorialProceso[]>([]);
  cargandoHistorial = signal(false);
  cargandoFinalizar  = signal(false);

  superPreviewVisible = signal(false);

  ariaLive = computed(() => this.mensaje());

  private idTramite = 0;

  constructor(@Inject(MODAL_DATA) public data: { idTramite?: number } | null) {
    if (data?.idTramite) {
      this.idTramite = data.idTramite;
    }
  }

  ngOnInit() {
    this.cargarHistorial();
  }

  ngOnDestroy() {
    this.revokeObjectUrl();
  }

  cerrar() {
    this.modalRef.close();
  }

  // ------------------ Historial ------------------
  cargarHistorial() {
    const id = this.idTramite;
    if (id > 0) {
      this.cargandoHistorial.set(true);
      this.tramiteService.obtenerHistorial(id).subscribe({
        next: r => this.historial.set(r),
        error: () => this.historial.set([]),
        complete: () => this.cargandoHistorial.set(false)
      });
    } else {
      this.historial.set([]);
    }
  }

  // ------------------ Archivo ------------------
  onFileInputChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) {
      this.procesarArchivo(input.files[0]);
      input.value = '';
    }
  }

  onFileDropped(list: FileList) {
    if (list.length) this.procesarArchivo(list[0]);
  }

  private procesarArchivo(file: File) {
    if (file.size > this.maxSizeBytes) {
      this.mensaje.set(`El archivo supera ${(this.maxSizeBytes/1024/1024).toFixed(1)}MB`);
      this.esError.set(true);
      return;
    }

    this.revokeObjectUrl();
    this.archivo.set(null);
    this.mensaje.set('');
    this.esError.set(false);

    const esImagen = file.type.startsWith('image/');
    const preview: ArchivoPreview = {
      file,
      nombre: file.name,
      tamanoKb: +(file.size/1024).toFixed(1),
      tipo: file.type || 'desconocido',
      esImagen
    };

    // Imágenes y PDFs en base64 (porque backend lo necesita)
    const reader = new FileReader();

    if (esImagen || file.type === 'application/pdf') {
      reader.onload = () => {
        preview.base64 = reader.result as string; // data:<mime>;base64,...
        // Si PDF: crear además objectUrl + safeUrl para iframe
        if (file.type === 'application/pdf') {
          preview.objectUrl = URL.createObjectURL(file);
          preview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(preview.objectUrl);
        }
        this.archivo.set(preview);
      };
      reader.readAsDataURL(file);
    } else {
      // Otros tipos: solo object URL para abrir/descargar
      preview.objectUrl = URL.createObjectURL(file);
      preview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(preview.objectUrl);
      this.archivo.set(preview);
    }
  }

  marcarIframeError() {
    const a = this.archivo();
    if (!a) return;
    a.cargaFallida = true;
    this.archivo.set({ ...a });
  }

  quitarArchivo() {
    this.revokeObjectUrl();
    this.archivo.set(null);
    this.superPreviewVisible.set(false);
  }

  private revokeObjectUrl() {
    const a = this.archivo();
    if (a?.objectUrl) URL.revokeObjectURL(a.objectUrl);
  }

  abrirSuper() {
    if (this.archivo()) this.superPreviewVisible.set(true);
  }
  cerrarSuper() {
    this.superPreviewVisible.set(false);
  }

  abrirEnNuevaPestana() {
    const a = this.archivo();
    if (!a) return;
    if (a.objectUrl) {
      window.open(a.objectUrl, '_blank');
    } else if (a.base64) {
      window.open(a.base64, '_blank');
    }
  }

  // ------------------ Guardar / Finalizar ------------------
  guardar() {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.cargando.set(true);
    this.mensaje.set('');
    this.esError.set(false);

    const arch = this.archivo();
    const payload: DetallesTramite = {
      tramite: { idTramite: this.idTramite },
      tipoProceso: this.form.value.tipoProceso!,
      detalles: this.form.value.detalles!,
      nombreArchivo: arch?.nombre || '',
      urlArchivo: arch?.base64 || ''   // Base64 (PDF o imagen). Si vacío -> no se guarda archivo.
    };

    this.tramiteService.agregarDetalles(payload).subscribe({
      next: r => {
        this.mensaje.set(r.mensaje || 'Detalles guardados');
        this.esError.set(false);
        this.form.patchValue({ detalles: '' });
        this.quitarArchivo();
        this.cargarHistorial();
      },
      error: e => {
        this.mensaje.set(e.error?.mensaje || e.error?.message || 'Error al guardar');
        this.esError.set(true);
      },
      complete: () => this.cargando.set(false)
    });
  }

  finalizarTramiteClick() {
    const id = this.idTramite;
    if (!id || id <= 0) {
      this.mensaje.set('ID Trámite inválido');
      this.esError.set(true);
      return;
    }
    this.cargandoFinalizar.set(true);
    this.mensaje.set('');
    this.esError.set(false);

    this.tramiteService.finalizarTramite(id).subscribe({
      next: r => {
        this.mensaje.set(r.mensaje || 'Trámite finalizado correctamente');
        this.esError.set(false);
        this.cargarHistorial();
      },
      error: e => {
        this.mensaje.set(e.error?.mensaje || 'No se pudo finalizar el trámite');
        this.esError.set(true);
      },
      complete: () => this.cargandoFinalizar.set(false)
    });
  }

  limpiarTodo() {
    this.form.reset({
      tipoProceso: 'Seguimiento',
      detalles: ''
    });
    this.quitarArchivo();
    this.mensaje.set('');
    this.esError.set(false);
    this.cargarHistorial();
  }

  descargarAdjunto(item: HistorialProceso) {
    if (!item.nombreArchivo) return;
    const url = `${environment.apiUrl}/download/` + encodeURIComponent(item.nombreArchivo);
    window.open(url, '_blank');
  }

  private focusFirstInvalid() {
    const invalid = Object.keys(this.form.controls)
      .find(k => (this.form.controls as any)[k].invalid);
    if (!invalid) return;
    const el = document.querySelector<HTMLElement>(`[formcontrolname="${invalid}"]`);
    el?.focus();
  }

  logExitoPDF() {
    console.log('PDF cargado en iframe correctamente');
  }
}