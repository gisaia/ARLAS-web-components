import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CogPreviewComponent } from './cog-preview.component';

describe('CogPreviewComponent', () => {
  let component: CogPreviewComponent;
  let fixture: ComponentFixture<CogPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CogPreviewComponent,
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader } })
      ],
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: vi.fn(() => of())
          }
        }
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
