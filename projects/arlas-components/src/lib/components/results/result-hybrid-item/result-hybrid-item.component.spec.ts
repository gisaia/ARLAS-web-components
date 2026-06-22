import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultHybridItemComponent } from './result-hybrid-item.component';
import { beforeEach, describe, expect, it } from 'vitest';
import {TranslateLoader, TranslateModule, TranslateNoOpLoader} from '@ngx-translate/core';
import { Item } from '../model/item';

describe('ResultHybrideItemComponent', () => {
  let component: ResultHybridItemComponent;
  let fixture: ComponentFixture<ResultHybridItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultHybridItemComponent,
        TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
      })]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultHybridItemComponent);
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
