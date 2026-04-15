import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MapImportComponent } from './map-import.component';

describe('MapglImportComponent', () => {
  let component: MapImportComponent<any, any, any>;
  let fixture: ComponentFixture<MapImportComponent<any, any, any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MapImportComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
