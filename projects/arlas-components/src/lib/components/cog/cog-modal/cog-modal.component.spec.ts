import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CogModalComponent } from './cog-modal.component';

describe('CogModalComponent', () => {
  let component: CogModalComponent;
  let fixture: ComponentFixture<CogModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CogModalComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ],
      providers: [ {provide: MAT_DIALOG_DATA, useValue: {}}]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CogModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
