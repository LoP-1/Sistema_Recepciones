import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tramite } from './tramite';

describe('Tramite', () => {
  let component: Tramite;
  let fixture: ComponentFixture<Tramite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tramite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tramite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
