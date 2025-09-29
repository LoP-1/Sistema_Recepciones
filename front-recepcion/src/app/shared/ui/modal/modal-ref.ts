import { Subject } from 'rxjs';
import { ModalCloseReason } from './modal.tokens';

export class ModalRef<TComponent = unknown, TResult = unknown> {
  readonly afterClosed$ = new Subject<TResult | undefined>();
  private _closed = false;

  constructor(
    private _closeImpl: (result?: TResult, reason?: ModalCloseReason) => void
  ) {}

  _setCloseImpl(fn: (result?: TResult, reason?: ModalCloseReason) => void) {
    this._closeImpl = fn;
  }

  close(result?: TResult, reason: ModalCloseReason = 'closeMethod') {
    if (this._closed) return;
    this._closed = true;
    this._closeImpl(result, reason);
    this.afterClosed$.complete();
  }
}