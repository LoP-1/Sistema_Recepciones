import { InjectionToken } from '@angular/core';

export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');

export type ModalCloseReason =
  | 'closeMethod'
  | 'backdrop'
  | 'escape'
  | 'service'
  | 'destroyed';