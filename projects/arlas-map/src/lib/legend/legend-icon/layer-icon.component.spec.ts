import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerIconComponent } from './layer-icon.component';

describe('LayerIconComponent', () => {
  let component: LayerIconComponent;
  let fixture: ComponentFixture<LayerIconComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [LayerIconComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
