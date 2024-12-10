import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MapglSettingsComponent } from './mapgl-settings.component';

describe('MapglSettingsComponent', () => {
  let component: MapglSettingsComponent;
  let fixture: ComponentFixture<MapglSettingsComponent>;

  beforeEach(waitForAsync(() => {
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
