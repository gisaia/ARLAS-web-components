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

import { CardResultItemMetadataEntryComponent } from './card-result-item-metadata-entry.component';
import { beforeEach, describe, expect, it } from 'vitest';
import {TranslateLoader, TranslateModule, TranslateNoOpLoader} from '@ngx-translate/core';
describe('ResultMetaBadgeComponent', () => {
  let component: CardResultItemMetadataEntryComponent;
  let fixture: ComponentFixture<CardResultItemMetadataEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardResultItemMetadataEntryComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardResultItemMetadataEntryComponent);
    fixture.componentRef.setInput('metadataEntry', {value: 'test'});
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
