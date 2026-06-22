/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateNoOpLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { Item } from '../model/item';
import { DetailedDataRetriever } from '../utils/detailed-data-retriever';
import { ResultDetailedItemComponent } from './result-detailed-item.component';

describe('ResultDetailedItemComponent', () => {
  let component: ResultDetailedItemComponent;
  let fixture: ComponentFixture<ResultDetailedItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader } }),
        ResultDetailedItemComponent
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultDetailedItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rowItem', new Item([], [], new Map()));
    fixture.componentRef.setInput('detailedDataRetriever', {
      detailsConfig: [],
      getActions: (i: Item) => of([])
    } as DetailedDataRetriever);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
