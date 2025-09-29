import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  createComponent
} from '@angular/core';
import { MODAL_DATA, ModalCloseReason } from './modal.tokens';
import { ModalConfig } from './modal-config';
import { ModalRef } from './modal-ref';

interface ActiveModal {
  id: number;
  ref: ModalRef<any, any>;
  cmpRef: ComponentRef<any>;
  backdropEl: HTMLElement;
  panelEl: HTMLElement;
  previouslyFocused?: HTMLElement | null;
  config: ModalConfig;
}

let MODAL_ID = 0;

@Injectable({ providedIn: 'root' })
export class ModalService {
  private stack: ActiveModal[] = [];

  constructor(
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector
  ) {}

  open<TComponent, TData = unknown, TResult = unknown>(
    component: any,
    config: ModalConfig<TData> = {}
  ): ModalRef<TComponent, TResult> {

    const id = ++MODAL_ID;

    const backdropEl = document.createElement('div');
    backdropEl.className = 'app-modal-backdrop';
    if (config.backdropClass) this._addClasses(backdropEl, config.backdropClass);

    const panelEl = document.createElement('div');
    panelEl.className = 'app-modal-panel';
    if (config.panelClass) this._addClasses(panelEl, config.panelClass);
    if (config.width) panelEl.style.width = config.width;

    panelEl.setAttribute('role', config.role || 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    if (config.ariaLabel) panelEl.setAttribute('aria-label', config.ariaLabel);
    if (config.ariaDescribedBy) panelEl.setAttribute('aria-describedby', config.ariaDescribedBy);

    // Crear ref primero
    const modalRef = new ModalRef<TComponent, TResult>(() => {});
    const elementInjector = Injector.create({
      providers: [
        { provide: MODAL_DATA, useValue: config.data },
        { provide: ModalRef, useValue: modalRef }
      ],
      parent: this.envInjector
    });

    const cmpRef = createComponent<TComponent>(component, {
      environmentInjector: this.envInjector,
      hostElement: panelEl,
      elementInjector
    });

    backdropEl.appendChild(panelEl);
    document.body.appendChild(backdropEl);
    this.appRef.attachView(cmpRef.hostView);

    if (this.stack.length === 0) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (!config.disableFocusTrap) {
      setTimeout(() => this._focusFirst(panelEl), 0);
      this._setupFocusTrap(panelEl);
    }

    if (config.closeOnBackdrop !== false) {
      backdropEl.addEventListener('mousedown', (ev) => {
        if (ev.target === backdropEl) {
          modalRef.close(undefined, 'backdrop');
        }
      });
    }

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (config.closeOnEscape !== false)) {
        if (this.stack[this.stack.length - 1]?.id === id) {
          e.stopPropagation();
          modalRef.close(undefined, 'escape');
        }
      }
    };
    document.addEventListener('keydown', keyHandler, { capture: true });

    modalRef._setCloseImpl((result, reason) => {
      this._destroy(id, result, reason);
      document.removeEventListener('keydown', keyHandler, { capture: true });
      if (config.restoreFocus !== false && previouslyFocused) {
        setTimeout(() => previouslyFocused.focus(), 0);
      }
    });

    this.stack.push({
      id,
      ref: modalRef,
      cmpRef,
      backdropEl,
      panelEl,
      previouslyFocused,
      config
    });

    return modalRef;
  }

  closeAll(reason: ModalCloseReason = 'service') {
    [...this.stack].forEach(entry => entry.ref.close(undefined, reason));
  }

  private _destroy(id: number, result: unknown, reason?: ModalCloseReason) {
    const idx = this.stack.findIndex(m => m.id === id);
    if (idx === -1) return;
    const entry = this.stack[idx];
    this.stack.splice(idx, 1);

    this.appRef.detachView(entry.cmpRef.hostView);
    entry.cmpRef.destroy();
    entry.backdropEl.remove();
    entry.ref.afterClosed$.next(result as any);

    if (this.stack.length === 0) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  }

  private _focusFirst(panel: HTMLElement) {
    const list = this._getFocusable(panel);
    list[0]?.focus();
  }

  private _getFocusable(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }

  private _setupFocusTrap(panel: HTMLElement) {
    panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const list = this._getFocusable(panel);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  private _addClasses(el: HTMLElement, classes: string | string[]) {
    if (Array.isArray(classes)) el.classList.add(...classes);
    else el.classList.add(classes);
  }
}