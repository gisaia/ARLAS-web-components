import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapImportComponent } from './map-import.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

describe('MapglImportComponent', () => {
  let component: MapImportComponent;
  let fixture: ComponentFixture<MapImportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapImportComponent ],
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
    fixture = TestBed.createComponent(MapImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
