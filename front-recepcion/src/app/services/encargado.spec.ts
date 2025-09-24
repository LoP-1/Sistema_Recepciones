import { TestBed } from '@angular/core/testing';
import { EncargadoService } from './encargado';

describe('Encargado', () => {
  let service: EncargadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EncargadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
