import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapglImportComponent } from './mapgl-import.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

describe('MapglImportComponent', () => {
  let component: MapglImportComponent;
  let fixture: ComponentFixture<MapglImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapglImportComponent ],
      imports: [
        MatDialogModule,
        FormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatRadioModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
