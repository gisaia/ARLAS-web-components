import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WmtsLayerManagerDemoComponent } from './wmts-layer-manager-demo.component';

describe('WmtsLayerManagerDemoComponent', () => {
  let component: WmtsLayerManagerDemoComponent;
  let fixture: ComponentFixture<WmtsLayerManagerDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WmtsLayerManagerDemoComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WmtsLayerManagerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
