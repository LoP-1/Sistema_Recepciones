export interface ModalConfig<TData = unknown> {
  data?: TData;
  width?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: 'dialog' | 'alertdialog';
  closeOnBackdrop?: boolean;     // default true
  closeOnEscape?: boolean;       // default true
  disableFocusTrap?: boolean;    // default false
  restoreFocus?: boolean;        // default true
  panelClass?: string | string[];
  backdropClass?: string | string[];
}