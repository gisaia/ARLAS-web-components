import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglSettingsComponent } from './mapgl-settings.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';

describe('MapglSettingsComponent', () => {
  let component: MapglSettingsComponent;
  let fixture: ComponentFixture<MapglSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MapglSettingsComponent],
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
    fixture = TestBed.createComponent(MapglSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
