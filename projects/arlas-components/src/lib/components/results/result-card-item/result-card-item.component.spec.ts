import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockDetailedDataRetriever, mockRowItem } from '../../../test/mock';
import { ResultCardItemComponent } from './result-card-item.component';

describe('ResultCardItemComponent', () => {
  let component: ResultCardItemComponent;
  let fixture: ComponentFixture<ResultCardItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultCardItemComponent,
        LazyLoadImageModule,
        TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
      })]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultCardItemComponent);
    const i = mockRowItem;
    i.urlThumbnail = 'test.png';
    fixture.componentRef.setInput('rowItem', i);
    fixture.componentRef.setInput('detailedDataRetriever', mockDetailedDataRetriever);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
