import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiBarsRowComponent } from './multi-bars-row.component';

describe('MultiBarsRowComponent', () => {
  let component: MultiBarsRowComponent;
  let fixture: ComponentFixture<MultiBarsRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiBarsRowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiBarsRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
