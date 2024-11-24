import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSettingsComponent } from './map-settings.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

describe('MapSettingsComponent', () => {
  let component: MapSettingsComponent;
  let fixture: ComponentFixture<MapSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MapSettingsComponent],
      imports: [
        MatTabsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatIconModule,
        MatButtonModule,
        MatRadioModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
