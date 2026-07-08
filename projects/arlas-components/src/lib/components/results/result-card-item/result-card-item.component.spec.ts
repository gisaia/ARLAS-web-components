import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultCardItemComponent } from './result-card-item.component';
import { beforeEach, describe, expect, it } from 'vitest';
import {TranslateLoader, TranslateModule, TranslateNoOpLoader} from '@ngx-translate/core';
import { Item } from '../model/item';
import {LazyLoadImageModule} from 'ng-lazyload-image';

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
    const i = new Item([], [], new Map());
    i.urlThumbnail = 'test.png';
    fixture.componentRef.setInput('rowItem', i);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
