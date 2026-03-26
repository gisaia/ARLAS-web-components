import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LayerIconComponent } from './layer-icon.component';

describe('LayerIconComponent', () => {
  let component: LayerIconComponent;
  let fixture: ComponentFixture<LayerIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayerIconComponent],
    }).compileComponents();
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
