import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CogPreviewComponent } from './cog-preview.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

describe('CogPreviewComponent', () => {
  let component: CogPreviewComponent;
  let fixture: ComponentFixture<CogPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CogPreviewComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CogPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
