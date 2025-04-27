import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SumarEstrellasComponent } from './sumar-estrellas.component';

describe('SumarEstrellasComponent', () => {
  let component: SumarEstrellasComponent;
  let fixture: ComponentFixture<SumarEstrellasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SumarEstrellasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SumarEstrellasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
