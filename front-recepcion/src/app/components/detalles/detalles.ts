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

// Estructura para manejar la vista previa y datos del archivo adjunto
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

  tiposProceso = ['Seguimiento','Llamada','Verificación','Adjunto','Observación','Personalizado'];

  form = this.fb.nonNullable.group({
    tipoProceso: ['Seguimiento', Validators.required],
    detalles: ['', [Validators.required, Validators.minLength(5)]],
    boleta: [''],
    monto: [''],
    customTipoProceso: ['']
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

    const reader = new FileReader();
    reader.onload = () => {
      preview.base64 = reader.result as string;
      if (file.type === 'application/pdf') {
        preview.objectUrl = URL.createObjectURL(file);
        preview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(preview.objectUrl);
      }
      if (!esImagen && file.type !== 'application/pdf') {
        preview.objectUrl = URL.createObjectURL(file);
        preview.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(preview.objectUrl);
      }
      this.archivo.set(preview);
    };
    reader.readAsDataURL(file);
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

  guardar() {
    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }
    this.cargando.set(true);
    this.mensaje.set('');
    this.esError.set(false);

    const arch = this.archivo();

    let tipoProcesoFinal = this.form.value.tipoProceso ?? '';
    if (tipoProcesoFinal === 'Personalizado') {
      tipoProcesoFinal = this.form.value.customTipoProceso?.trim() || 'Personalizado';
    }

    const payload: DetallesTramite = {
      tramite: { idTramite: this.idTramite },
      tipoProceso: tipoProcesoFinal,
      detalles: this.form.value.detalles!,
      nombreArchivo: arch?.nombre || '',
      urlArchivo: arch?.base64 || '',
      boleta: this.form.value.boleta || undefined,
      monto: this.form.value.monto !== '' && this.form.value.monto !== null ? Number(this.form.value.monto) : undefined
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
      detalles: '',
      boleta: '',
      monto: '',
      customTipoProceso: ''
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

  ImprimirTramite() {
  const items = this.historial();
  if (!items.length) return;

  const ultimo = items[items.length - 1];
  const tramite = ultimo.tramite;
  const encargado = tramite.encargado;

  const escapeHtml = (v: any) =>
    String(v ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');

  const formatFecha = (f: any) => {
    if (!f) return '';
    try {
      const d = new Date(f);
      if (isNaN(d.getTime())) return escapeHtml(f);
      return d.toLocaleDateString('es-PE', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch {
      return escapeHtml(f);
    }
  };

  const logoUrl = 'logo-drej.png'; // Ruta real proporcionada

  const fechaEmision = new Date();
  const fechaEmisionStr = fechaEmision.toLocaleDateString('es-PE', {
    year:'numeric', month:'2-digit', day:'2-digit'
  });
  const horaEmisionStr = fechaEmision.toLocaleTimeString('es-PE', {
    hour:'2-digit', minute:'2-digit'
  });

  const estadoTexto = tramite.estado ? 'Completado' : 'En proceso';

  const html = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Constancia - ${escapeHtml(tramite.nroExpediente || '')}</title>
      <style>
        @page {
          size: A5 portrait;
          margin: 14mm 16mm;
        }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          font-size: 12px;
          color: #000;
          margin: 0;
          -webkit-print-color-adjust: exact;
        }
        .logo-wrapper {
          text-align: center;
          margin-bottom: 6px;
        }
        .logo-wrapper img {
          max-height: 70px;
          max-width: 140px;
        }
        .title {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: .5px;
          text-transform: uppercase;
          margin: 2px 0 4px;
        }
        .expediente {
          text-align: center;
          font-size: 11px;
          margin-bottom: 10px;
        }
        .emitido {
          text-align: right;
          font-size: 10px;
          margin-top: -4px;
          margin-bottom: 10px;
        }
        .section {
          margin-top: 10px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin: 12px 0 4px;
          letter-spacing: .5px;
        }
        table.clean {
          width: 100%;
          border-collapse: collapse;
        }
        table.clean td {
          padding: 2px 0 2px;
          vertical-align: top;
        }
        table.clean td.label {
          width: 42%;
          font-weight: 600;
          padding-right: 8px;
          white-space: nowrap;
        }
        .descripcion {
          margin-top: 6px;
          font-size: 11.5px;
          line-height: 1.35;
          white-space: pre-wrap;
        }
        .estado-box {
          font-weight: 600;
        }
        .firmas {
          display: flex;
          margin-top: 26px;
          gap: 28px;
        }
        .firma {
          flex: 1;
          text-align: center;
          font-size: 11px;
        }
        .firma-linea {
          margin-top: 42px;
          border-top: 1px solid #000;
          padding-top: 4px;
        }
        .footer {
          margin-top: 20px;
          font-size: 9px;
          text-align: center;
        }
        /* Opcional: separador sutil */
        hr.linea {
          border: none;
          border-top: 1px solid #000;
          margin: 10px 0 12px;
          height: 0;
        }

        /* Para asegurar buena impresión monocromática */
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="logo-wrapper">
        <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">
      </div>
      <div class="title">CONSTANCIA DE TRÁMITE</div>
      <div class="expediente">Expediente: <strong>${escapeHtml(tramite.nroExpediente || '')}</strong></div>
      <div class="emitido">Emitido: ${fechaEmisionStr} ${horaEmisionStr}</div>
      <hr class="linea">

      <div class="section">
        <div class="section-title">Beneficiario</div>
        <table class="clean">
          <tr>
            <td class="label">Nombre</td>
            <td>${escapeHtml(tramite.persona?.nombre || '')}</td>
          </tr>
          <tr>
            <td class="label">DNI</td>
            <td>${escapeHtml(tramite.persona?.dni || '')}</td>
          </tr>
            <tr>
            <td class="label">Teléfono</td>
            <td>${escapeHtml(tramite.persona?.telefono || '')}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Información del Trámite</div>
        <table class="clean">
          <tr>
            <td class="label">Encargado</td>
            <td>${encargado ? escapeHtml(encargado.nombre + ' ' + encargado.apellido) : ''}</td>
          </tr>
          <tr>
            <td class="label">DNI Encargado</td>
            <td>${encargado ? escapeHtml(encargado.dni) : ''}</td>
          </tr>
          <tr>
            <td class="label">Períodos solicitados</td>
            <td>${escapeHtml(tramite.fechas || '')}</td>
          </tr>
          <tr>
            <td class="label">Fecha inicio</td>
            <td>${formatFecha(tramite.fechaInicio)}</td>
          </tr>
          <tr>
            <td class="label">Fecha fin</td>
            <td>${tramite.fechaFin ? formatFecha(tramite.fechaFin) : 'En proceso'}</td>
          </tr>
          <tr>
            <td class="label">Estado</td>
            <td class="estado-box">${escapeHtml(estadoTexto)}</td>
          </tr>
        </table>

        <div class="section-title" style="margin-top:14px;">Descripción</div>
        <div class="descripcion">
          ${escapeHtml(tramite.descripcion || '')}
        </div>
      </div>

      <div class="firmas">
        <div class="firma">
          <div class="firma-linea">Firma del Encargado</div>
        </div>
        <div class="firma">
          <div class="firma-linea">Firma del Beneficiario</div>
        </div>
      </div>

      <div class="footer">
        Documento generado automáticamente. Sujeto a verificación administrativa.<br>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 120);
        };
      </script>
    </body>
  </html>
  `;

  const ventana = window.open('', '_blank', 'width=840,height=1000');
  if (!ventana) return;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
}
}