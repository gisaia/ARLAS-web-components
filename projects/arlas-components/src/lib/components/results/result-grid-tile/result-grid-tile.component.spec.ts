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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TranslateLoader,
  TranslateModule,
  TranslateNoOpLoader,
} from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockDetailedDataRetriever, mockRowItem } from '../../../test/mock';
import { ResultGridTileComponent } from './result-grid-tile.component';

// Mock the IntersectionObserver, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
// Needed for the ng-lazyload as in JSDOM, there is no IntersectionObserver
export class IntersectionObserver {
  public root = null;
  public rootMargin = '';
  public thresholds = [];

  public disconnect() {
    return null;
  }

  public observe() {
    return null;
  }

  public takeRecords() {
    return [];
  }

  public unobserve() {
    return null;
  }
}
window.IntersectionObserver = IntersectionObserver;

describe('ResultGridTileComponent', () => {
  let component: ResultGridTileComponent;
  let fixture: ComponentFixture<ResultGridTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateNoOpLoader },
        }),
        MatTooltipModule,
        MatIconModule,
        ResultGridTileComponent
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultGridTileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('gridTile', mockRowItem);
    fixture.componentRef.setInput('detailedDataRetriever', mockDetailedDataRetriever);
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
