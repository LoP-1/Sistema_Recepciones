import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarDetallesTramite } from './detalles';

describe('Detalles', () => {
  let component: AgregarDetallesTramite;
  let fixture: ComponentFixture<AgregarDetallesTramite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarDetallesTramite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarDetallesTramite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
