import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerLegendDemoComponent } from './layer-legend-demo.component';

describe('LayerLegendComponent', () => {
  let component: LayerLegendDemoComponent;
  let fixture: ComponentFixture<LayerLegendDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayerLegendDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayerLegendDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
