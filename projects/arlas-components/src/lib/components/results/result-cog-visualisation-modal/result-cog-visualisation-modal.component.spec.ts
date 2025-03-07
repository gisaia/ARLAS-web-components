import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultCogVisualisationModalComponent } from './result-cog-visualisation-modal.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('ResultCogVisualisationModalComponent', () => {
  let component: ResultCogVisualisationModalComponent;
  let fixture: ComponentFixture<ResultCogVisualisationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultCogVisualisationModalComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ],
      providers: [ {provide: MAT_DIALOG_DATA, useValue: {}}]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultCogVisualisationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
